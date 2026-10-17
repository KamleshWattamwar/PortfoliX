import React from 'react';
import { ShieldCheck, Plus, Upload, Sparkles, TrendingUp, BarChart, Layers } from 'lucide-react';

export default function EmptyState({ onOpenAddModal, onOpenCsvModal, onLoadDemo, loading }) {
  return (
    <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: '720px', margin: '2rem auto' }}>
      
      {/* Icon Badge */}
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1.5rem auto',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
      }}>
        <TrendingUp size={32} color="#2563eb" />
      </div>

      <h2 style={{ fontSize: '2.1rem', fontWeight: '800', marginBottom: '0.85rem', letterSpacing: '-0.025em', color: '#0f172a' }}>
        No Portfolio Tracked Yet
      </h2>
      <p style={{ color: '#475569', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 2.25rem auto', lineHeight: '1.65' }}>
        Import your existing stock positions from your broker CSV, enter them manually, or test with our pre-configured NIFTY 50 bluechip sample portfolio.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.15rem', justifyContent: 'center' }}>
        <button 
          className="btn btn-primary"
          onClick={onLoadDemo}
          disabled={loading}
          style={{ padding: '0.9rem 1.85rem', fontSize: '1.02rem' }}
        >
          <Sparkles size={20} />
          Load 1-Click NIFTY Demo
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onOpenCsvModal}
          disabled={loading}
          style={{ padding: '0.9rem 1.85rem', fontSize: '1.02rem' }}
        >
          <Upload size={20} />
          Import Broker CSV
        </button>

        <button 
          className="btn btn-secondary"
          onClick={onOpenAddModal}
          disabled={loading}
          style={{ padding: '0.9rem 1.85rem', fontSize: '1.02rem' }}
        >
          <Plus size={20} />
          Add Manually
        </button>
      </div>

      {/* Features preview pills */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginTop: '4rem', textAlign: 'left' }}>
        <div style={{ background: '#f8fafc', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <BarChart size={18} color="#2563eb" />
            <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>Beta & Volatility</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.55' }}>
            Annualized risk metrics benchmarking against NIFTY 50.
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <Layers size={18} color="#2563eb" />
            <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>Correlation Matrix</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.55' }}>
            Identify concentration risk and co-movement across holdings.
          </p>
        </div>

        <div style={{ background: '#f8fafc', padding: '1.35rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={18} color="#dc2626" />
            <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#0f172a' }}>Max Drawdown</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: '1.55' }}>
            Historical peak-to-trough worst decline timeline.
          </p>
        </div>
      </div>

    </div>
  );
}
