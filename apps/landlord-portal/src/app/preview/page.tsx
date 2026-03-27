'use client';

import React from 'react';
import { ScoreMeter, GoogleLoginButton, QuickAddTenant } from '@kiraaya/ui';

export default function OverallPreviewPage() {
  return (
    <div style={{ padding: '40px', background: '#FDFCFB', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid #EEE', paddingBottom: '20px' }}>
        <h1 style={{ color: '#0F6E56', fontSize: '32px', fontWeight: '800' }}>Kiraaya Constructive Preview</h1>
        <p style={{ color: '#666' }}>Comprehensive view of Phase 1 MVP Core Interfaces</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Section 1: RentScore Engine */}
        <section className="card" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#111' }}>1. RentScore™ Engine (Tenant View)</h2>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ScoreMeter score={785} tier="Prime" streakMonths={12} isLimitedData={false} />
          </div>
          <p style={{ marginTop: '20px', color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
            The proprietary scoring engine (300-900) verified via AA and cash-scaling multipliers.
          </p>
        </section>

        {/* Section 2: Onboarding & Auth */}
        <section className="card" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#111' }}>2. Unified Login (Secure OCR/OTP)</h2>
          <div style={{ padding: '20px', border: '1px dashed #DDD', borderRadius: '16px' }}>
            <GoogleLoginButton role="tenant" onLoginSuccess={() => {}} />
            <div style={{ textAlign: 'center', margin: '15px 0', color: '#999' }}>OR</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input placeholder="+91 · Phone Number" style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #EEE' }} />
              <button style={{ background: '#0F6E56', color: '#fff', padding: '12px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>OTP</button>
            </div>
          </div>
        </section>

        {/* Section 3: Landlord Quick-Add */}
        <section className="card" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#111' }}>3. Rapid Tenant Registration</h2>
          <QuickAddTenant />
        </section>

        {/* Section 4: Automated Agreements */}
        <section className="card" style={{ background: '#fff', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#111' }}>4. E-Stamp & Digital Signatures</h2>
          <div style={{ background: '#F8F7F4', padding: '20px', borderRadius: '12px', border: '1px solid #EAE8E1' }}>
            <div style={{ borderLeft: '4px solid #EF9F27', paddingLeft: '15px' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>KA-2024-RENTAL-DRAFT</p>
              <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>Karnataka Residential Lease Agreement · Sec 15-B</p>
            </div>
            <button style={{ marginTop: '20px', width: '100%', background: '#fff', border: '1px solid #0F6E56', color: '#0F6E56', padding: '12px', borderRadius: '8px', fontWeight: '600' }}>
              Preview Draft (PDF)
            </button>
          </div>
        </section>

      </div>

      <footer style={{ marginTop: '60px', textAlign: 'center', color: '#AAA', fontSize: '12px' }}>
        Kiraaya Fintech · Phase 1 MVP · Build 2026.03.26
      </footer>
    </div>
  );
}
