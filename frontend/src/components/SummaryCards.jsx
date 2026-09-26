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
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Invested
          </span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wallet size={16} color="var(--accent-indigo)" />
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {formatINR(summary.total_invested)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Across {summary.holdings_count} position{summary.holdings_count === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* 2. Current Market Value */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Current Value
          </span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart2 size={16} color="var(--accent-cyan)" />
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)' }}>
            {formatINR(summary.total_current_value)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Live market valuation
          </div>
        </div>
      </div>

      {/* 3. Total Unrealized P&L */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Unrealized P&L
          </span>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '8px', 
            background: isProfitable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            {isProfitable ? (
              <TrendingUp size={16} color="var(--accent-emerald)" />
            ) : (
              <TrendingDown size={16} color="var(--accent-rose)" />
            )}
          </div>
        </div>
        <div>
          <div className="mono-text" style={{ 
            fontSize: '1.6rem', 
            fontWeight: '800', 
            color: isProfitable ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
          }}>
            {formatINR(summary.total_pnl)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem' }}>
            <span className={`badge ${isProfitable ? 'badge-positive' : 'badge-negative'}`}>
              {pnlPercentFormatted}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>overall returns</span>
          </div>
        </div>
      </div>

      {/* 4. Portfolio Beta & Sharpe Ratio */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Portfolio Risk Index
          </span>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={16} color="var(--accent-violet)" />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Beta vs NIFTY</div>
            <div className="mono-text" style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>
              {beta.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: beta > 1.1 ? '#fbbf24' : beta < 0.9 ? '#34d399' : '#94a3b8' }}>
              {beta > 1.1 ? 'High Sensitivity' : beta < 0.9 ? 'Defensive' : 'Market Neutral'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sharpe Ratio</div>
            <div className="mono-text" style={{ fontSize: '1.3rem', fontWeight: '800', color: sharpe > 1.0 ? 'var(--accent-emerald)' : 'var(--text-primary)' }}>
              {sharpe.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Vol: {vol} | Max DD: {mdd}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
