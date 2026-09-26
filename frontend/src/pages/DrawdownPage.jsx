import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioDrawdown } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import DrawdownChart from '../components/DrawdownChart';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, TrendingDown, ShieldAlert, BarChart3 } from 'lucide-react';

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
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Maximum Historical Drawdown
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: 'var(--accent-rose)' }}>
                {maxDdPercent}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Peak-to-trough worst percentage loss
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Lookback Data Points
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: 'var(--accent-cyan)' }}>
                {dataPointsCount} Days
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aligned daily market trading sessions
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Capital Preservation Rating
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: Math.abs(drawdown?.max_drawdown || 0) < 0.15 ? 'var(--accent-emerald)' : '#fbbf24' }}>
                {Math.abs(drawdown?.max_drawdown || 0) < 0.15 ? 'Conservative' : Math.abs(drawdown?.max_drawdown || 0) < 0.25 ? 'Moderate' : 'High Drawdown'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Based on peak downside exposure
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShieldAlert size={18} color="var(--accent-rose)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                Why Maximum Drawdown Matters
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Maximum Drawdown (MDD) measures the largest percentage decline in the cumulative portfolio value from its peak to its lowest trough before a new peak is reached. Unlike simple volatility, MDD highlights real downside pain and capital recovery risk during market corrections.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
