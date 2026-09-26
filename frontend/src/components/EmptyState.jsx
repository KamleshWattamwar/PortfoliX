import React from 'react';
import { ShieldCheck, Plus, Upload, Sparkles, TrendingUp, BarChart, Layers } from 'lucide-react';

export default function EmptyState({ onOpenAddModal, onOpenCsvModal, onLoadDemo, loading }) {
  return (
    <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '720px', margin: '2rem auto' }}>
      
      {/* Icon Badge */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem auto',
        boxShadow: '0 8px 30px rgba(99, 102, 241, 0.25)'
      }}>
        <TrendingUp size={32} color="var(--accent-cyan)" />
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
        No Portfolio Tracked Yet
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
        Import your existing stock positions from your broker CSV, enter them manually, or test with our pre-configured NIFTY 50 bluechip sample portfolio.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary"
          onClick={onLoadDemo}
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
        >
          <Sparkles size={18} />
          Load 1-Click NIFTY Demo
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onOpenCsvModal}
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
        >
          <Upload size={18} />
          Import Broker CSV
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onOpenAddModal}
          disabled={loading}
          style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem' }}
        >
          <Plus size={18} />
          Add Manually
        </button>
      </div>

      {/* Features preview pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '3.5rem', textAlign: 'left' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <BarChart size={16} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Beta & Volatility</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Annualized risk metrics benchmarking against NIFTY 50.
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Layers size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Correlation Matrix</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Identify concentration risk and co-movement across holdings.
          </p>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <ShieldCheck size={16} color="var(--accent-rose)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)' }}>Max Drawdown</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Historical peak-to-trough worst decline timeline.
          </p>
        </div>
      </div>

    </div>
  );
}
