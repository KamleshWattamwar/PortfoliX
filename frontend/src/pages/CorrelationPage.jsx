import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioCorrelation } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, Grid, HelpCircle, Layers } from 'lucide-react';

export default function CorrelationPage() {
  const { hasHoldings, refreshTrigger, loadDemo, actionLoading } = usePortfolio();

  const [correlation, setCorrelation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!hasHoldings) {
      setCorrelation(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getPortfolioCorrelation();
      setCorrelation(data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || err.message || 'Failed to load correlation matrix.');
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

  return (
    <div className="page-container">
      {error && (
        <div className="badge badge-negative" style={{ padding: '0.8rem 1.25rem', fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !correlation ? (
        <div className="loading-container">
          <RefreshCw size={32} className="spin-anim" style={{ color: 'var(--accent-indigo)' }} />
          <p>Aligning historical daily returns and calculating pairwise correlation matrix...</p>
        </div>
      ) : (
        <>
          {/* Main Correlation Heatmap */}
          <CorrelationHeatmap
            matrix={correlation?.matrix}
            tickers={correlation?.tickers}
          />

          {/* Educational / Insight Card */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} color="var(--accent-cyan)" />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Understanding Portfolio Diversification & Correlation
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#6ee7b7', display: 'block', marginBottom: '0.2rem' }}>
                  Low / Negative Correlation (&lt; 0.3)
                </strong>
                Assets move independently or in opposite directions. Adding low-correlation assets significantly lowers aggregate portfolio volatility without sacrificing expected return (Markowitz Modern Portfolio Theory).
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                <strong style={{ color: '#fca5a5', display: 'block', marginBottom: '0.2rem' }}>
                  High Positive Correlation (&gt; 0.7)
                </strong>
                Assets tend to move together (e.g. peer tech giants TCS & Infosys, or banking peers HDFC & ICICI). High intra-portfolio correlation reduces diversification and increases drawdown vulnerability during sector downturns.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
