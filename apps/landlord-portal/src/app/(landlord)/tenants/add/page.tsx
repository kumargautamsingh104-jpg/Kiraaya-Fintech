'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AddTenantPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    propertyId: '',
    tenantPhone: '',
    unitIdentifier: '',
    tenancyType: 'residential',
    monthlyRent: '',
    securityDeposit: '',
    moveInDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    async function loadProperties() {
      try {
        const token = localStorage.getItem('kiraaya_token');
        const res = await fetch('/api/v1/properties', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProperties(data.data);
          if (data.data.length > 0) {
            setForm(f => ({ ...f, propertyId: data.data[0].id }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadProperties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('kiraaya_token');
      const res = await fetch('/api/v1/tenancies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          monthlyRentPaise: parseInt(form.monthlyRent) * 100,
          securityDepositPaise: form.securityDeposit ? parseInt(form.securityDeposit) * 100 : undefined,
          moveInDate: new Date(form.moveInDate).toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        alert(JSON.stringify(data.error));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content animate-fade-in">
      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--space-3)' }}>Add New Tenant</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Property</label>
            <select 
              className="input" 
              value={form.propertyId} 
              onChange={e => setForm({ ...form, propertyId: e.target.value })}
              required
            >
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 'var(--space-2)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Unit (e.g. Flat 4B)</label>
              <input 
                className="input" 
                placeholder="Flat 4B" 
                value={form.unitIdentifier}
                onChange={e => setForm({ ...form, unitIdentifier: e.target.value })}
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Tenant Phone</label>
              <input 
                className="input" 
                placeholder="+91..." 
                value={form.tenantPhone}
                onChange={e => setForm({ ...form, tenantPhone: e.target.value })}
                required 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 'var(--space-2)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Monthly Rent (₹)</label>
              <input 
                className="input" 
                type="number" 
                placeholder="25000" 
                value={form.monthlyRent}
                onChange={e => setForm({ ...form, monthlyRent: e.target.value })}
                required 
              />
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Security Deposit (₹)</label>
              <input 
                className="input" 
                type="number" 
                placeholder="50000" 
                value={form.securityDeposit}
                onChange={e => setForm({ ...form, securityDeposit: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Move-in Date</label>
            <input 
              className="input" 
              type="date" 
              value={form.moveInDate}
              onChange={e => setForm({ ...form, moveInDate: e.target.value })}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Confirm & Add Tenant
          </button>
        </form>
      </div>
    </div>
  );
}
