import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldCheck, 
  Zap, 
  BarChart2 
} from 'lucide-react';
import MetricHelp from './MetricHelp';

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export default function SummaryCards({ summary, risk }) {
  if (!summary) return null;

  const isProfitable = summary.total_pnl >= 0;
  const pnlPercentFormatted = `${isProfitable ? '+' : ''}${summary.total_pnl_percent.toFixed(2)}%`;
  
  const beta = risk?.portfolio_beta ?? 1.0;
  const sharpe = risk?.portfolio_sharpe_ratio ?? 0.0;
  const vol = (risk?.portfolio_volatility ? (risk.portfolio_volatility * 100).toFixed(1) : '0.0') + '%';
  const mdd = (risk?.portfolio_max_drawdown ? (risk.portfolio_max_drawdown * 100).toFixed(1) : '0.0') + '%';

  return (
    <div className="summary-grid">
      
      {/* 1. Total Invested */}
      <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Total Invested
          </span>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={22} color="#2563eb" />
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {formatINR(summary.total_invested)}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.45rem', fontWeight: 500 }}>
            Across {summary.holdings_count} active position{summary.holdings_count === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* 2. Current Market Value */}
      <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Current Value
          </span>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={22} color="#2563eb" />
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ fontSize: '2.35rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {formatINR(summary.total_current_value)}
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.45rem', fontWeight: 500 }}>
            Live market valuation
          </div>
        </div>
      </div>

      {/* 3. Total Unrealized P&L */}
      <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Unrealized P&L
          </span>
          <div style={{ 
            width: '46px', 
            height: '46px', 
            borderRadius: '12px', 
            background: isProfitable ? '#f0fdf4' : '#fef2f2', 
            border: `1px solid ${isProfitable ? '#bbf7d0' : '#fecaca'}`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {isProfitable ? (
              <TrendingUp size={22} color="#16a34a" />
            ) : (
              <TrendingDown size={22} color="#dc2626" />
            )}
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ 
            fontSize: '2.35rem', 
            fontWeight: '800', 
            color: isProfitable ? '#15803d' : '#b91c1c',
            letterSpacing: '-0.025em',
            lineHeight: 1.15
          }}>
            {formatINR(summary.total_pnl)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.45rem' }}>
            <span className={`badge ${isProfitable ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.82rem', padding: '0.25rem 0.6rem' }}>
              {pnlPercentFormatted}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>overall returns</span>
          </div>
        </div>
      </div>

      {/* 4. Portfolio Beta & Sharpe Ratio */}
      <div className="glass-panel" style={{ padding: '1.85rem 2.1rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Portfolio Risk Index
          </span>
          <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#2563eb" />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '0.2rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              Beta vs NIFTY <MetricHelp title="Portfolio Beta" body="Sensitivity to NIFTY 50. >1.1 = aggressive, <0.9 = defensive." faqId="beta" />
            </div>
            <div className="mono-text" style={{ fontSize: '1.9rem', fontWeight: '800', color: '#0f172a', marginTop: '0.2rem', lineHeight: 1.15 }}>
              {beta.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, marginTop: '0.2rem', color: beta > 1.1 ? '#dc2626' : beta < 0.9 ? '#16a34a' : '#2563eb' }}>
              {beta > 1.1 ? 'Aggressive' : beta < 0.9 ? 'Defensive' : 'Market Neutral'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Sharpe Ratio</div>
            <div className="mono-text" style={{ fontSize: '1.9rem', fontWeight: '800', marginTop: '0.2rem', lineHeight: 1.15, color: sharpe > 1.0 ? '#15803d' : sharpe < 0 ? '#b91c1c' : '#0f172a' }}>
              {sharpe.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem', fontWeight: 600 }}>
              Vol: {vol} | MDD: {mdd}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
