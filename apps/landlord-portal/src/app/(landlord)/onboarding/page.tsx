'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STEPS = [
  { id: 'phone', title: 'Verify Phone', description: 'Confirm your mobile with OTP' },
  { id: 'kyc', title: 'Identity KYC', description: 'PAN & Aadhaar verification' },
  { id: 'property', title: 'Property Setup', description: 'Add your first building' },
  { id: 'bank', title: 'Bank Account', description: 'Where you receive rent' },
  { id: 'agreement', title: 'Template', description: 'Choose your rental terms' },
];

export default function LandlordOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  // Progress UI
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="container-narrow animate-fade-in" style={{ padding: '60px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        <h1 style={{ color: 'var(--color-primary)', fontSize: 32, fontWeight: 800 }}>Kiraaya</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: 8 }}>Landlord Setup Checklist</p>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="text-label">Step {currentStep + 1} of 5</span>
            <span className="text-label" style={{ color: 'var(--color-primary)' }}>{Math.round(progress)}% Complete</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Current step content */}
        <div style={{ minHeight: 120 }}>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>{STEPS[currentStep].title}</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
            {STEPS[currentStep].description}
          </p>

          {/* Step-specific forms would go here */}
          <div style={{ background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)', borderRadius: 8, padding: 40, textAlign: 'center' }}>
            {currentStep === 0 && <p>📞 Phone verification complete ✓</p>}
            {currentStep === 1 && <p>🪪 Redirecting to Digio for KYC...</p>}
            {currentStep > 1 && <p>Feature coming soon in Phase 1 setup.</p>}
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          {currentStep > 0 && (
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentStep(s => s - 1)}>
              Back
            </button>
          )}
          <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => {
            if (currentStep < STEPS.length - 1) {
              setCurrentStep(s => s + 1);
            } else {
              router.push('/dashboard');
            }
          }}>
            {currentStep === STEPS.length - 1 ? 'Go to Dashboard' : 'Next Step'}
          </button>
        </div>
      </div>

      {/* Checklist visualization */}
      <div style={{ marginTop: 'var(--space-4)', opacity: 0.6 }}>
        {STEPS.map((step, i) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ 
              width: 24, height: 24, borderRadius: '50%', 
              backgroundColor: i < currentStep ? 'var(--color-primary)' : i === currentStep ? 'white' : 'transparent',
              border: `2px solid ${i <= currentStep ? 'var(--color-primary)' : 'var(--color-border)'}`,
              color: i < currentStep ? 'white' : i === currentStep ? 'var(--color-primary)' : 'var(--color-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold'
            }}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: 14, fontWeight: i === currentStep ? '600' : '400' }}>{step.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
