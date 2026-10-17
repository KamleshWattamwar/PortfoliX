import React, { useState, useEffect, useCallback } from 'react';
import { getPortfolioRisk, getPortfolioSummary } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import ConcentrationBanner from '../components/ConcentrationBanner';
import RiskTable from '../components/RiskTable';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle, Activity, ShieldCheck, Zap, Info } from 'lucide-react';
import MetricHelp from '../components/MetricHelp';

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
            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                Portfolio Beta (vs NIFTY 50)
                <MetricHelp
                  title="Portfolio Beta (β)"
                  body="Measures sensitivity to NIFTY 50 movements. β > 1 = amplifies market swings. β < 1 = more defensive."
                  faqId="beta"
                />
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: beta > 1.1 ? '#dc2626' : beta < 0.9 ? '#16a34a' : '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {beta.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: beta > 1.1 ? '#dc2626' : beta < 0.9 ? '#16a34a' : '#2563eb' }}>
                {beta > 1.1 ? 'Aggressive / High Sensitivity' : beta < 0.9 ? 'Defensive / Low Sensitivity' : 'Market Neutral'}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                Annualized Volatility (σ)
                <MetricHelp
                  title="Annualized Volatility (σ)"
                  body="Standard deviation of daily returns scaled to 252 trading days. Higher % = more unpredictable returns."
                  faqId="volatility"
                />
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#2563eb', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {vol}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Standard deviation scaled to 252 trading days
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                Sharpe Ratio (Rf = 7%)
                <MetricHelp
                  title="Annualized Sharpe Ratio"
                  body="Excess return per unit of risk vs a 7% risk-free rate. > 1.0 = good. < 0 = underperformed a bank deposit."
                  faqId="sharpe"
                />
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: sharpe > 1.0 ? '#15803d' : sharpe < 0 ? '#b91c1c' : '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {sharpe.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Excess risk-adjusted return over Indian G-Sec yield
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                Maximum Drawdown
                <MetricHelp
                  title="Maximum Drawdown (MDD)"
                  body="Largest peak-to-trough portfolio decline in the lookback period. More negative = worse historical loss event."
                  faqId="max-drawdown"
                />
              </div>
              <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#dc2626', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
                {mdd}
              </div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 500 }}>
                Worst historical peak-to-trough decline
              </div>
            </div>
          </div>

          {/* Per-Stock Risk Table */}
          <RiskTable perStock={risk?.per_stock} benchmark={risk?.benchmark} />

          {/* Methodology Info Card */}
          <div className="glass-panel" style={{ padding: '2rem 2.25rem', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Info size={24} color="#2563eb" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: '800', marginBottom: '0.45rem', color: '#0f172a' }}>
                Quantitative Risk Engine Methodology
              </h4>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.65' }}>
                All metrics are computed deterministically over a 1-year historical lookback window using live closing prices. <strong>Beta</strong> is calculated against the benchmark NIFTY 50 Index (<code>^NSEI</code>). <strong>Sharpe Ratio</strong> assumes an annualized risk-free rate of 7.0% (standard benchmark for Indian 10-year Sovereign Government Bonds).
              </p>
              <a href="/faq" style={{ fontSize: '0.92rem', color: '#2563eb', fontWeight: '800', marginTop: '0.65rem', display: 'inline-block', textDecoration: 'none' }}>
                Understand these metrics in detail in our Risk FAQ →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
