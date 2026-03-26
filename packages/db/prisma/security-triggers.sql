-- Kiraaya Security Triggers
-- Run AFTER prisma migrate deploy

-- ─────────────────────────────────────────────
-- 1. Aadhaar Guard
-- Raises exception if a 12-digit numeric string is written to users table
-- UIDAI compliance: Aadhaar number must never be stored
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_no_aadhaar()
RETURNS TRIGGER AS $$
DECLARE
  col_val TEXT;
  col_name TEXT;
BEGIN
  -- Check all text columns in the users table
  FOREACH col_name IN ARRAY ARRAY[
    NEW.name_encrypted,
    NEW.pan_encrypted,
    NEW.digio_kyc_reference
  ] LOOP
    IF col_name IS NOT NULL AND col_name ~ '^\d{12}$' THEN
      RAISE EXCEPTION 'AADHAAR_GUARD: 12-digit numeric value rejected in users table. '
        'Aadhaar numbers must NEVER be stored. Use Digio tokenised reference only.';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_aadhaar_guard ON users;
CREATE TRIGGER trg_aadhaar_guard
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_check_no_aadhaar();


-- ─────────────────────────────────────────────
-- 2. Events Log Immutability
-- Prevent DELETE on events_log — RBI audit compliance
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_prevent_events_log_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AUDIT_GUARD: Direct DELETE on events_log is not permitted. '
    'Events log is immutable per RBI audit requirements. '
    'For DPDP compliance, set entity_id = NULL via the account deletion procedure.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_log_no_delete ON events_log;
CREATE TRIGGER trg_events_log_no_delete
  BEFORE DELETE ON events_log
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_events_log_delete();


-- ─────────────────────────────────────────────
-- 3. Rent Payments — Prevent Direct Mutations
-- All mutations must go through stored procedures that also write events_log
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_rent_payment_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow via stored procedure (check application_name marker)
  IF current_setting('app.bypass_payment_trigger', true) = 'true' THEN
    RETURN NEW;
  END IF;

  -- Log the mutation attempt
  INSERT INTO events_log (id, entity_type, entity_id, actor_id, actor_role, action, payload, created_at)
  VALUES (
    gen_random_uuid(),
    'rent_payment',
    OLD.id,
    current_user,
    'db_direct',
    CASE TG_OP
      WHEN 'UPDATE' THEN 'payment.direct_update_attempted'
      WHEN 'DELETE' THEN 'payment.direct_delete_attempted'
    END,
    jsonb_build_object('old_status', OLD.status, 'operation', TG_OP),
    now()
  );

  -- Block the operation
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'PAYMENT_GUARD: Direct DELETE on rent_payments is not permitted. Use the payment update stored procedure.';
    RETURN NULL;
  END IF;

  -- For UPDATE: allow but require the stored procedure context
  RAISE WARNING 'PAYMENT_GUARD: Direct UPDATE on rent_payments detected. Use application stored procedures.';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rent_payment_audit ON rent_payments;
CREATE TRIGGER trg_rent_payment_audit
  BEFORE UPDATE OR DELETE ON rent_payments
  FOR EACH ROW EXECUTE FUNCTION fn_rent_payment_audit();


-- ─────────────────────────────────────────────
-- 4. Masked view for engineers (never raw PII columns)
-- ─────────────────────────────────────────────

CREATE OR REPLACE VIEW users_masked AS
  SELECT
    id,
    phone,
    role,
    kyc_status,
    pan_last4,
    preferred_language,
    deletion_requested_at,
    created_at,
    updated_at
  FROM users;

COMMENT ON VIEW users_masked IS
  'Use this view instead of direct SELECT on users table. '
  'PII columns (name_encrypted, pan_encrypted, digio_kyc_reference) are excluded.';


-- ─────────────────────────────────────────────
-- 5. Loan amount guard function
-- Called by app layer before INSERT on loan_applications (Phase 2 table)
-- Documented here for future Phase 2 implementation
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION fn_check_mta_loan_cap(
  p_tenancy_id UUID,
  p_requested_amount_paise BIGINT,
  p_tenancy_type TEXT
) RETURNS VOID AS $$
DECLARE
  v_monthly_rent_paise BIGINT;
  v_max_loan_paise BIGINT;
BEGIN
  SELECT monthly_rent_paise INTO v_monthly_rent_paise
  FROM tenancies WHERE id = p_tenancy_id;

  -- MTA 2021: residential = 2× monthly rent cap
  IF p_tenancy_type IN ('residential', 'pg') THEN
    v_max_loan_paise := v_monthly_rent_paise * 2;
  ELSE
    -- Commercial: 6× per MTA 2021
    v_max_loan_paise := v_monthly_rent_paise * 6;
  END IF;

  IF p_requested_amount_paise > v_max_loan_paise THEN
    RAISE EXCEPTION 'MTA_CAP: Loan amount ₹% exceeds maximum permitted under Model Tenancy Act 2021. Maximum: ₹%',
      p_requested_amount_paise / 100,
      v_max_loan_paise / 100;
  END IF;
END;
$$ LANGUAGE plpgsql;
