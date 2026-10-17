import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Layers, Layers2 } from 'lucide-react';
import MetricHelp from './MetricHelp';

const formatINR = (val) => {
  if (val === undefined || val === null || isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
};

export default function HoldingsTable({ holdings, onDelete, loading }) {
  if (!holdings || holdings.length === 0) return null;

  const handleDeleteClick = (h) => {
    let confirmed = false;
    if (h.lot_count && h.lot_count > 1) {
      confirmed = window.confirm(
        `This will delete all ${h.lot_count} buy lots for ${h.ticker}, totaling ${h.quantity} shares. Continue?`
      );
    } else {
      confirmed = window.confirm(`Delete ${h.ticker} position (${h.quantity} shares)?`);
    }

    if (confirmed) {
      onDelete(h.ticker);
    }
  };

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div className="panel-title">
          <Layers size={18} color="#2563eb" />
          Active Holdings & Positions ({holdings.length})
        </div>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Consolidated portfolio positions • Real-time valuation
        </span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th style={{ textAlign: 'right' }}>Total Qty</th>
              <th style={{ textAlign: 'right' }}>Avg Buy Price</th>
              <th style={{ textAlign: 'right' }}>Current Price</th>
              <th style={{ textAlign: 'right' }}>Current Value</th>
              <th style={{ textAlign: 'right' }}>Unrealized P&L</th>
              <th style={{ textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  Weight
                  <MetricHelp title="Portfolio Weight" body="This holding's share of total current portfolio value. Weights sum to 100%." faqId="portfolio-weights" />
                </span>
              </th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const isProfit = h.pnl >= 0;
              const hasMultipleLots = h.lot_count && h.lot_count > 1;

              return (
                <tr key={h.ticker}>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="mono-text" style={{ fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>
                          {h.ticker}
                        </span>
                        {hasMultipleLots && (
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.75rem', 
                              padding: '0.2rem 0.5rem', 
                              background: '#eff6ff', 
                              border: '1px solid #bfdbfe', 
                              color: '#1d4ed8' 
                            }}
                            title={`Blended average purchase price across ${h.lot_count} separate buy lots`}
                          >
                            <Layers2 size={12} style={{ marginRight: '0.25rem' }} />
                            {h.lot_count} lots
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        NSE India
                      </span>
                    </div>
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a', fontSize: '1.02rem' }}>
                    {h.quantity}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', color: '#475569', fontSize: '1.02rem' }}>
                    {formatINR(h.buy_price)}
                    {hasMultipleLots && (
                      <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.1rem' }}>
                        (blended)
                      </span>
                    )}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '700', color: '#0f172a', fontSize: '1.02rem' }}>
                    {formatINR(h.current_price)}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '800', color: '#0f172a', fontSize: '1.05rem' }}>
                    {formatINR(h.current_value)}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                      <span className="mono-text" style={{ 
                        fontWeight: '800', 
                        color: isProfit ? '#15803d' : '#b91c1c',
                        fontSize: '1.02rem'
                      }}>
                        {isProfit ? '+' : ''}{formatINR(h.pnl)}
                      </span>
                      <span className={`badge ${isProfit ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.78rem', padding: '0.2rem 0.5rem' }}>
                        {isProfit ? '+' : ''}{h.pnl_percent.toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div className="weight-bar-wrap" style={{ gap: '0.75rem' }}>
                      <div className="weight-bar" style={{ height: '8px' }}>
                        <div className="weight-bar-fill" style={{ width: Math.min(h.weight * 100, 100) + '%' }} />
                      </div>
                      <span className="mono-text" style={{ fontWeight: '800', color: '#0f172a', minWidth: '46px', textAlign: 'right', fontSize: '1.02rem' }}>
                        {(h.weight * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.5rem 0.75rem', borderRadius: '8px' }}
                      onClick={() => handleDeleteClick(h)}
                      disabled={loading}
                      title={`Delete all lots for ${h.ticker}`}
                    >
                      <Trash2 size={15} />
                    </button>
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
