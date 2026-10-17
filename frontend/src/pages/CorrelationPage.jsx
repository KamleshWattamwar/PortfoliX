import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioCorrelation } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import CorrelationHeatmap from '../components/CorrelationHeatmap';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, Grid, HelpCircle, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';

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
          <div className="glass-panel" style={{ padding: '2rem 2.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={22} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                Understanding Portfolio Diversification & Correlation
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', fontSize: '0.95rem', lineHeight: '1.65' }}>
              <div style={{ background: '#f0fdf4', padding: '1.4rem 1.5rem', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
                <strong style={{ color: '#15803d', display: 'block', marginBottom: '0.35rem', fontWeight: 800, fontSize: '1.02rem' }}>
                  Low / Negative Correlation (&lt; 0.3) • Diversification Benefit
                </strong>
                <span style={{ color: '#166534' }}>
                  Assets move independently or in opposite directions. Adding low-correlation assets significantly lowers aggregate portfolio volatility without sacrificing expected return (Markowitz Modern Portfolio Theory).
                </span>
              </div>

              <div style={{ background: '#fef2f2', padding: '1.4rem 1.5rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
                <strong style={{ color: '#b91c1c', display: 'block', marginBottom: '0.35rem', fontWeight: 800, fontSize: '1.02rem' }}>
                  High Positive Correlation (&gt; 0.7) • Concentration Risk
                </strong>
                <span style={{ color: '#991b1b' }}>
                  Assets tend to move together (e.g. peer tech giants TCS & Infosys, or banking peers HDFC & ICICI). High intra-portfolio correlation reduces diversification and increases drawdown vulnerability during sector downturns.
                </span>
              </div>
            </div>
            <div style={{ marginTop: '0.5rem', paddingTop: '0.9rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/faq" style={{ fontSize: '0.92rem', color: '#2563eb', fontWeight: '800', textDecoration: 'none' }}>
                Understand correlation in detail in our Risk FAQ →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
