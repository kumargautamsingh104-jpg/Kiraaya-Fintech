import React from 'react';

/**
 * Kiraaya Google Login Button (Step 11)
 * UX Goal: Social Login + Minimal Friction
 */
export const GoogleLoginButton = ({ onLoginSuccess, role }) => {
  const handleLogin = () => {
    console.log(`Initiating Google Login for ${role}...`);
    // Redirect to /api/auth/google (or Supabase Auth)
    window.location.href = '#'; // Mock for now
    alert('Google Auth flow triggered! In production, this opens the Google account picker.');
  };

  return (
    <button 
      onClick={handleLogin}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        padding: '14px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        background: '#fff',
        color: '#444',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = '#f9f9f9')}
      onMouseOut={(e) => (e.currentTarget.style.background = '#fff')}
    >
      <img 
        src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" 
        alt="Google" 
        style={{ width: '20px', height: '20px' }}
      />
      Continue with Google
    </button>
  );
};
