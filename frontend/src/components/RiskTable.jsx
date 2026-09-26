import React from 'react';
import { ShieldCheck, ArrowDownRight, ArrowUpRight, Gauge } from 'lucide-react';

export default function RiskTable({ perStock, benchmark = '^NSEI' }) {
  if (!perStock || perStock.length === 0) return null;

  const getRiskProfile = (beta, vol) => {
    if (beta > 1.25 || vol > 0.35) return { label: 'High Volatility', color: 'badge-negative' };
    if (beta < 0.85 && vol < 0.22) return { label: 'Defensive', color: 'badge-positive' };
    if (beta >= 0.85 && beta <= 1.15) return { label: 'Index Proxy', color: 'badge-neutral' };
    return { label: 'Moderate Risk', color: 'badge-warning' };
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Gauge size={18} color="var(--accent-violet)" />
          Per-Stock Quantitative Risk Metrics
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Benchmark: NIFTY 50 ({benchmark}) • 1-Yr Lookback
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th style={{ textAlign: 'right' }}>Weight</th>
              <th style={{ textAlign: 'right' }}>Annualized Volatility</th>
              <th style={{ textAlign: 'right' }}>Beta vs NIFTY</th>
              <th style={{ textAlign: 'right' }}>Sharpe Ratio</th>
              <th style={{ textAlign: 'right' }}>Max Drawdown</th>
              <th style={{ textAlign: 'center' }}>Risk Profile</th>
            </tr>
          </thead>
          <tbody>
            {perStock.map((stock) => {
              const profile = getRiskProfile(stock.beta, stock.volatility);
              const isHighSharpe = stock.sharpe_ratio > 1.0;
              const isNegativeSharpe = stock.sharpe_ratio < 0;

              return (
                <tr key={stock.ticker}>
                  <td>
                    <span className="mono-text" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                      {stock.ticker}
                    </span>
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {(stock.weight * 100).toFixed(1)}%
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '600' }}>
                    {(stock.volatility * 100).toFixed(1)}%
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '700', color: stock.beta > 1.2 ? '#fca5a5' : stock.beta < 0.9 ? '#86efac' : 'var(--text-primary)' }}>
                    {stock.beta.toFixed(2)}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '700', color: isHighSharpe ? 'var(--accent-emerald)' : isNegativeSharpe ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                    {stock.sharpe_ratio.toFixed(2)}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '600', color: 'var(--accent-rose)' }}>
                    {(stock.max_drawdown * 100).toFixed(1)}%
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span className={`badge ${profile.color}`} style={{ fontSize: '0.7rem' }}>
                      {profile.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
