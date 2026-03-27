'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewAgreementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tenancies, setTenancies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    tenancyId: searchParams.get('tenancyId') || '',
    templateVersion: 'KA_v1',
    customClauses: '',
  });

  useEffect(() => {
    async function loadTenancies() {
      try {
        const token = localStorage.getItem('kiraaya_token');
        const res = await fetch('/api/v1/tenancies', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTenancies(data.data.filter((t: any) => !t.agreement));
          if (data.data.length > 0 && !form.tenancyId) {
            setForm(f => ({ ...f, tenancyId: data.data[0].id }));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadTenancies();
  }, [form.tenancyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('kiraaya_token');
      const res = await fetch('/api/v1/agreements/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="main-content">Loading...</div>;

  return (
    <div className="main-content animate-fade-in">
      <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 'var(--font-h3)', marginBottom: 'var(--space-1)' }}>Draft Rental Agreement</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)', fontSize: 14 }}>
          Legally binding. Digitally signed via Aadhaar OTP.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Select Active Tenancy</label>
            <select 
              className="input" 
              value={form.tenancyId} 
              onChange={e => setForm({ ...form, tenancyId: e.target.value })}
              required
            >
              {tenancies.map(t => (
                <option key={t.id} value={t.id}>
                  {t.tenant.phone} — {t.property.name} ({t.unitIdentifier})
                </option>
              ))}
            </select>
            {tenancies.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-error)', marginTop: 4 }}>No tenancies without agreements found.</p>}
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-2)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Template State</label>
            <select 
              className="input" 
              value={form.templateVersion} 
              onChange={e => setForm({ ...form, templateVersion: e.target.value })}
              required
            >
              <option value="KA_v1">Karnataka Standard (+₹499 duty)</option>
              <option value="DL_v1">Delhi Standard (+₹599 duty)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Custom Clauses (Optional)</label>
            <textarea 
              className="input" 
              style={{ minHeight: 100, paddingTop: 12 }}
              placeholder="e.g. Painting charges applicable on exit..." 
              value={form.customClauses}
              onChange={e => setForm({ ...form, customClauses: e.target.value })}
            />
          </div>

          <div style={{ background: '#F8F7F4', padding: 16, borderRadius: 8, marginBottom: 'var(--space-3)', fontSize: 13 }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>Breakdown:</p>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Stamp Duty & E-Stamp</span>
              <span>₹{form.templateVersion === 'KA_v1' ? '499' : '599'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-primary)', fontWeight: 600, marginTop: 8 }}>
              <span>Total Fee</span>
              <span>₹{form.templateVersion === 'KA_v1' ? '499' : '599'}</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={tenancies.length === 0}>
            Create Draft Agreement
          </button>
        </form>
      </div>
    </div>
  );
}
