import React from 'react';
import { 
  TrendingUp, 
  Plus, 
  Upload, 
  Sparkles, 
  Trash2, 
  RefreshCw, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';

export default function Navbar({
  onOpenAddModal,
  onOpenCsvModal,
  onLoadDemo,
  onClearAll,
  onRefresh,
  loading,
  hasHoldings,
}) {
  return (
    <header className="glass-panel" style={{ borderRadius: '18px', padding: '1rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand Logo & Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(6, 182, 212, 0.4)'
          }}>
            <TrendingUp size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Portfoli<span style={{ background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>X</span>
              </h1>
              <span className="badge badge-neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem' }}>
                NSE / BSE Live
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Quantitative Portfolio Risk Engine & Analytics
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh calculations and live quotes"
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh
          </button>

          {!hasHoldings && (
            <button 
              className="btn btn-secondary btn-sm"
              style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.3)', color: '#a5b4fc' }}
              onClick={onLoadDemo}
              disabled={loading}
            >
              <Sparkles size={14} />
              Load NIFTY Demo
            </button>
          )}

          <button 
            className="btn btn-secondary btn-sm"
            onClick={onOpenCsvModal}
            disabled={loading}
          >
            <Upload size={14} />
            Import CSV
          </button>

          <button 
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
            disabled={loading}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Position
          </button>

          {hasHoldings && (
            <button 
              className="btn btn-danger btn-sm"
              onClick={onClearAll}
              disabled={loading}
              title="Reset entire portfolio"
            >
              <Trash2 size={14} />
              Clear
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
