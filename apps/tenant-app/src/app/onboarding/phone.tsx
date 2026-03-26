import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, typography } from '../../constants/design';

export default function PhoneOTPScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequestOTP() {
    if (phone.length !== 10) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await resp.json();
      if (data.success) {
        setStep('otp');
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP() {
    if (otp.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/v1/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, role: 'tenant' }),
      });
      const data = await resp.json();
      if (data.success) {
        // Store JWT
        const { MMKV } = await import('react-native-mmkv');
        new MMKV().set('kiraaya_token', data.data.token);
        
        if (data.data.user.kycStatus === 'full_kyc') {
          router.replace('/(tabs)');
        } else {
          router.push('/onboarding/pan');
        }
      } else {
        setError(data.error || 'Invalid OTP');
      }
    } catch (err) {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.top}>
          <Text style={styles.title}>
            {step === 'phone' ? t('onboarding.phoneLabel') : t('onboarding.otpLabel')}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'phone' 
              ? t('onboarding.tagline') 
              : t('onboarding.otpHint', { phone })}
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'phone' ? (
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="9876543210"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              autoFocus
            />
          ) : (
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              placeholder="0 0 0 0 0 0"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              autoFocus
              letterSpacing={10}
              textAlign="center"
            />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity 
            style={[styles.btn, (loading || (step === 'phone' ? phone.length !== 10 : otp.length !== 6)) && styles.btnDisabled]}
            disabled={loading || (step === 'phone' ? phone.length !== 10 : otp.length !== 6)}
            onPress={step === 'phone' ? handleRequestOTP : handleVerifyOTP}
          >
            {loading ? <ActivityIndicator color="white" /> : (
              <Text style={styles.btnText}>{t('onboarding.next')}</Text>
            )}
          </TouchableOpacity>

          {step === 'otp' && (
            <TouchableOpacity style={styles.resendBtn} onPress={() => setStep('phone')}>
              <Text style={styles.resendText}>Wrong phone number?</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  inner: { flex: 1, padding: spacing.lg, paddingTop: 100 },
  top: { marginBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: radius.button,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 13, fontWeight: '500' },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: radius.button,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: 'white', fontSize: 18, fontWeight: '700' },
  resendBtn: { marginTop: spacing.md, alignItems: 'center' },
  resendText: { color: colors.primary, fontWeight: '600' },
});
