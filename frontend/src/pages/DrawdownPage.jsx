import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioDrawdown } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import DrawdownChart from '../components/DrawdownChart';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, TrendingDown, ShieldAlert, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DrawdownPage() {
  const { hasHoldings, refreshTrigger, loadDemo, actionLoading } = usePortfolio();

  const [drawdown, setDrawdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!hasHoldings) {
      setDrawdown(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPortfolioDrawdown();
      setDrawdown(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || err.message || 'Failed to load drawdown analytics.');
      }
    } finally {
      setLoading(false);
    }
  }, [hasHoldings]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  if (!hasHoldings && !loading) {
    return (
      <EmptyState
        onOpenAddModal={() => document.querySelector('.topbar-actions button:last-child')?.click()}
        onOpenCsvModal={() => document.querySelector('.topbar-actions button:nth-last-child(2)')?.click()}
        onLoadDemo={loadDemo}
        loading={actionLoading}
      />
    );
  }

  const maxDdPercent = drawdown?.max_drawdown ? (drawdown.max_drawdown * 100).toFixed(2) : '0.00';
  const dataPointsCount = drawdown?.dates?.length || 0;

  return (
    <div className="page-container">
      {error && (
        <div className="badge badge-negative" style={{ padding: '0.8rem 1.25rem', fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !drawdown ? (
        <div className="loading-container">
          <RefreshCw size={32} className="spin-anim" style={{ color: 'var(--accent-indigo)' }} />
          <p>Reconstructing portfolio cumulative returns and historical drawdown timeline...</p>
        </div>
      ) : (
        <>
          {/* Main Drawdown Chart */}
          <DrawdownChart drawdownData={drawdown} />

          {/* Drawdown Risk Summary Cards */}
          <div className="summary-grid">
            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Maximum Historical Drawdown
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#dc2626', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {maxDdPercent}%
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Peak-to-trough worst percentage loss
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Lookback Data Points
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {dataPointsCount} Days
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Aligned daily market trading sessions
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Capital Preservation Rating
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: Math.abs(drawdown?.max_drawdown || 0) < 0.15 ? '#15803d' : Math.abs(drawdown?.max_drawdown || 0) < 0.25 ? '#2563eb' : '#dc2626', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {Math.abs(drawdown?.max_drawdown || 0) < 0.15 ? 'Conservative' : Math.abs(drawdown?.max_drawdown || 0) < 0.25 ? 'Moderate' : 'High Drawdown'}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Based on peak downside exposure
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className="glass-panel" style={{ padding: '2rem 2.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fee2e2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={24} color="#dc2626" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.45rem', color: '#0f172a' }}>
                Why Maximum Drawdown Matters
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: '1.65' }}>
                Maximum Drawdown (MDD) measures the largest percentage decline in the cumulative portfolio value from its peak to its lowest trough before a new peak is reached. Unlike simple volatility, MDD highlights real downside pain and capital recovery risk during market corrections.
              </p>
              <Link to="/faq" style={{ fontSize: '0.92rem', color: '#2563eb', fontWeight: '800', marginTop: '0.65rem', display: 'inline-block', textDecoration: 'none' }}>
                Learn how to interpret drawdown in our Risk FAQ →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
