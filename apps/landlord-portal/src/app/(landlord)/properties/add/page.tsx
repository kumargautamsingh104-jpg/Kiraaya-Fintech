'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddPropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: 'bengaluru',
    state: 'Karnataka',
    totalUnits: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('kiraaya_token');
      const res = await fetch('/api/v1/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          totalUnits: parseInt(form.totalUnits)
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

  return (
    <div className="main-content animate-fade-in">
      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--space-3)' }}>Register Property</h1>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Property Name</label>
            <input 
              className="input" 
              placeholder="e.g. Skyline Apartments" 
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              required 
            />
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Full Address</label>
            <textarea 
              className="input" 
              placeholder="No. 123, 4th Main..." 
              style={{ minHeight: 80, paddingTop: 12 }}
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 'var(--space-2)' }}>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>City</label>
              <select 
                className="input" 
                value={form.city} 
                onChange={e => setForm({ ...form, city: e.target.value })}
                required
              >
                <option value="bengaluru">Bengaluru</option>
                <option value="delhi_ncr">Delhi NCR</option>
              </select>
            </div>
            <div className="form-group">
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>State</label>
              <input 
                className="input" 
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Total Units (Rooms/Flats)</label>
            <input 
              className="input" 
              type="number" 
              value={form.totalUnits}
              onChange={e => setForm({ ...form, totalUnits: e.target.value })}
              required 
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Register Property
          </button>
        </form>
      </div>
    </div>
  );
}
