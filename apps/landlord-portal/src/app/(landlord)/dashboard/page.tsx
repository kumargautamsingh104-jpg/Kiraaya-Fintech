'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandlordDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUnits: 0,
    occupiedUnits: 0,
    collectedPaise: 0,
    expectedPaise: 0,
    overdueCount: 0,
  });
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeProperty, setActiveProperty] = useState<string | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPro, setIsPro] = useState(false);

  interface Tenant {
    id: string;
    name: string;
    unit: string;
    amountPaise: number;
    status: 'paid' | 'pending' | 'missed' | 'due';
  }

  interface Property {
    id: string;
    name: string;
    totalUnits: number;
  }

  useEffect(() => {
    async function load() {
      // Check for preview mode in URL
      const params = new URLSearchParams(window.location.search);
      const isPreview = params.get('preview') === 'true';

      if (isPreview) {
        setStats({
          totalUnits: 25,
          occupiedUnits: 18,
          collectedPaise: 45000000,
          expectedPaise: 52000000,
          overdueCount: 2,
        });
        setTenants([
          { id: '1', name: 'Arun Vijay', unit: 'A-402', amountPaise: 2500000, status: 'paid' },
          { id: '2', name: 'Sarayu K.', unit: 'B-105', amountPaise: 1800000, status: 'pending' },
          { id: '3', name: 'Vikram Singh', unit: 'C-201', amountPaise: 3500000, status: 'missed' },
        ]);
        setProperties([{ id: 'p1', name: 'Lakeview Apartments', totalUnits: 15 }, { id: 'p2', name: 'Green Valley', totalUnits: 10 }]);
        setIsPro(true);
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('kiraaya_token');
        if (!token) { router.push('/login'); return; }

        const [dashRes, tenantsRes] = await Promise.all([
          fetch('/api/v1/landlord/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/v1/tenancies', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const dash = await dashRes.json();
        const tenantsData = await tenantsRes.json();

        if (dash.success) setStats(dash.data.stats);
        if (tenantsData.success) {
          setTenants(tenantsData.data.tenants);
          setProperties(tenantsData.data.properties ?? []);
          setIsPro((tenantsData.data.totalUnits ?? 0) >= 20);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  const fmt = (paise: number) =>
    `₹${(paise / 100).toLocaleString('en-IN')}`;

  const collectionPct = stats.expectedPaise > 0
    ? Math.round((stats.collectedPaise / stats.expectedPaise) * 100)
    : 0;

  const initials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const statusColor: Record<string, string> = {
    paid: '#1A8B4A',
    pending: '#EF9F27',
    missed: '#D85A30',
    due: '#9A9A9A',
  };

  if (loading) {
    return (
      <div className="main-content">
        <div className="stats-grid">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ height: 16, width: '60%', marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 32, width: '40%' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="main-content animate-fade-in">
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-h2)', marginBottom: 4 }}>
            {isPro ? 'Property Dashboard' : 'Dashboard'}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
          <Link href="/properties/add" className="btn btn-secondary">
            + Add Property
          </Link>
          <Link href="/tenants/add" className="btn btn-primary">
            + Add Tenant
          </Link>
        </div>
      </div>

      {/* Pro mode: Property switcher */}
      {isPro && properties.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-3)', overflowX: 'auto', paddingBottom: 4 }}>
          <button
            className={`score-pill ${!activeProperty ? 'score-pill-established' : ''}`}
            onClick={() => setActiveProperty(null)}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            All Properties
          </button>
          {properties.map(p => (
            <button
              key={p.id}
              className={`score-pill ${activeProperty === p.id ? 'score-pill-established' : ''}`}
              onClick={() => setActiveProperty(p.id)}
              style={{ border: 'none', cursor: 'pointer', background: activeProperty === p.id ? undefined : 'rgba(0,0,0,0.05)', color: activeProperty === p.id ? undefined : 'var(--color-text-secondary)' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Collected This Month</p>
          <p className="stat-value" style={{ color: 'var(--color-primary)' }}>
            {fmt(stats.collectedPaise)}
          </p>
          <p className="stat-sub">of {fmt(stats.expectedPaise)} expected</p>
          <div className="progress-bar" style={{ marginTop: 8 }}>
            <div className="progress-fill" style={{ width: `${collectionPct}%` }} />
          </div>
        </div>

        <div className="stat-card">
          <p className="stat-label">Occupancy</p>
          <p className="stat-value">{stats.occupiedUnits} / {stats.totalUnits}</p>
          <p className="stat-sub">units occupied</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Overdue</p>
          <p className="stat-value" style={{ color: stats.overdueCount > 0 ? 'var(--color-error)' : 'var(--color-primary)' }}>
            {stats.overdueCount}
          </p>
          <p className="stat-sub">tenants overdue</p>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)' }}>
          <p className="stat-label" style={{ color: 'rgba(255,255,255,0.7)' }}>Collection Rate</p>
          <p className="stat-value" style={{ color: 'white' }}>{collectionPct}%</p>
          <p className="stat-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>this month</p>
        </div>
      </div>

      {/* Tenant list */}
      <div style={{ marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Tenants</h2>
          {isPro && (
            <button className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: 14 }}
              onClick={async () => {
                const token = localStorage.getItem('kiraaya_token');
                await fetch('/api/v1/payments/reminders/bulk', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` },
                });
              }}
            >
              Send All Reminders
            </button>
          )}
        </div>

        <div className="tenant-grid">
          {tenants.map((tenant) => (
            <Link
              key={tenant.id}
              href={`/tenants/${tenant.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div className="tenant-card" style={{ cursor: 'pointer' }}>
                <div className="tenant-card-avatar">
                  {initials(tenant.name)}
                </div>
                <div className="tenant-card-info">
                  <p className="tenant-card-name">{tenant.name}</p>
                  <p className="tenant-card-unit">{tenant.unit} · {fmt(tenant.amountPaise)}/mo</p>
                </div>
                <span
                  className="status-dot"
                  style={{ background: statusColor[tenant.status] ?? '#9A9A9A' }}
                  title={tenant.status}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <Link href="/agreements/new" className="btn btn-secondary" style={{ flex: 1 }}>
          📄 New Agreement
        </Link>
        <Link href="/insurance/buy" className="btn btn-secondary" style={{ flex: 1 }}>
          🛡️ Buy Insurance
        </Link>
        <Link href="/payments" className="btn btn-secondary" style={{ flex: 1 }}>
          💰 Payment Ledger
        </Link>
      </div>
    </div>
  );
}
