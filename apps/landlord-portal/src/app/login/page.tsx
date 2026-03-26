import React from 'react';
import { GoogleLoginButton } from '@/components/GoogleLoginButton';

/**
 * Landlord Login Page (Step 11)
 */
export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F7F4' }}>
      <div style={{ width: '400px', padding: '40px', background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)' }}>
        <h1 style={{ textAlign: 'center', fontSize: '24px', color: '#0F6E56', marginBottom: '8px' }}>Kiraaya</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '32px' }}>Landlord Portal</p>
        
        <GoogleLoginButton role="landlord" onLoginSuccess={() => {}} />
        
        <div style={{ textAlign: 'center', margin: '20px 0', color: '#ccc', fontSize: '14px' }}>OR</div>
        
        <input 
          placeholder="Phone Number" 
          style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '16px' }}
        />
        <button 
          style={{ width: '100%', padding: '14px', borderRadius: '8px', border: 'none', background: '#0F6E56', color: '#fff', fontWeight: 'bold' }}
        >
          Request OTP
        </button>
      </div>
    </div>
  );
}
