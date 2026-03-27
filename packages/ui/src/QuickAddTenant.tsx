'use client';

import React, { useState } from 'react';

/**
 * Landlord Quick-Add Tenant (Step 7)
 * Goal: < 5 minute onboarding
 */
export const QuickAddTenant = () => {
  const [formData, setFormData] = useState({ phone: '', rent: '', moveIn: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Adding Tenant:', formData);
    // Call API /api/v1/tenancies
    alert('Tenant invite sent via WhatsApp! 🚀');
  };

  return (
    <div style={{ maxWidth: '400px', padding: '24px', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Quick Add Tenant</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input 
          placeholder="Tenant Phone Number" 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <input 
          placeholder="Monthly Rent (₹)" 
          type="number"
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
        />
        <div style={{ fontSize: '12px', color: '#666' }}>Standard Karnataka Move-in Date</div>
        <input 
          type="date"
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }}
          onChange={(e) => setFormData({ ...formData, moveIn: e.target.value })}
        />
        <button 
          style={{ 
            background: '#0F6E56', 
            color: '#fff', 
            padding: '14px', 
            borderRadius: '8px', 
            border: 'none', 
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Activate Tenancy
        </button>
      </form>
    </div>
  );
};
