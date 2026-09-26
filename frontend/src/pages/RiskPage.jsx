import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioRisk, getPortfolioSummary } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import ConcentrationBanner from '../components/ConcentrationBanner';
import RiskTable from '../components/RiskTable';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, Activity, ShieldCheck, Zap, Info } from 'lucide-react';

export default function RiskPage() {
  const { hasHoldings, refreshTrigger, loadDemo, actionLoading } = usePortfolio();

  const [risk, setRisk] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!hasHoldings) {
      setRisk(null);
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [riskData, sumData] = await Promise.all([
        getPortfolioRisk(),
        getPortfolioSummary(),
      ]);
      setRisk(riskData);
      setSummary(sumData);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || err.message || 'Failed to load risk analytics.');
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

  const beta = risk?.portfolio_beta ?? 1.0;
  const sharpe = risk?.portfolio_sharpe_ratio ?? 0.0;
  const vol = (risk?.portfolio_volatility ? (risk.portfolio_volatility * 100).toFixed(1) : '0.0') + '%';
  const mdd = (risk?.portfolio_max_drawdown ? (risk.portfolio_max_drawdown * 100).toFixed(1) : '0.0') + '%';

  return (
    <div className="page-container">
      {error && (
        <div className="badge badge-negative" style={{ padding: '0.8rem 1.25rem', fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading && !risk ? (
        <div className="loading-container">
          <RefreshCw size={32} className="spin-anim" style={{ color: 'var(--accent-indigo)' }} />
          <p>Calculating annualized volatility, beta vs NIFTY 50 & Sharpe ratios...</p>
        </div>
      ) : (
        <>
          {/* Concentration Warning Alert */}
          <ConcentrationBanner warnings={risk?.concentration_warnings} />

          {/* Portfolio-level Risk Metric Cards */}
          <div className="summary-grid">
            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Portfolio Beta (vs NIFTY 50)
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: beta > 1.1 ? '#fca5a5' : beta < 0.9 ? '#86efac' : 'var(--text-primary)' }}>
                {beta.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {beta > 1.1 ? 'Aggressive / High Sensitivity' : beta < 0.9 ? 'Defensive / Lower Sensitivity' : 'Market Neutral'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Annualized Volatility (σ)
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: 'var(--accent-cyan)' }}>
                {vol}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Standard deviation scaled to 252 trading days
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Sharpe Ratio (Rf = 7%)
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: sharpe > 1.0 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
                {sharpe.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Excess risk-adjusted return over Indian G-Sec yield
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>
                Maximum Drawdown
              </div>
              <div className="mono-text" style={{ fontSize: '1.8rem', fontWeight: '800', margin: '0.4rem 0', color: 'var(--accent-rose)' }}>
                {mdd}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Worst historical peak-to-trough decline
              </div>
            </div>
          </div>

          {/* Per-Stock Risk Table */}
          <RiskTable perStock={risk?.per_stock} benchmark={risk?.benchmark} />

          {/* Methodology Info Card */}
          <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={18} color="var(--accent-indigo)" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.3rem', color: 'var(--text-primary)' }}>
                Quantitative Risk Engine Methodology
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                All metrics are computed deterministically over a 1-year historical lookback window using live closing prices. <strong>Beta</strong> is calculated against the benchmark NIFTY 50 Index (<code>^NSEI</code>). <strong>Sharpe Ratio</strong> assumes an annualized risk-free rate of 7.0% (standard benchmark for Indian 10-year Sovereign Government Bonds).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
