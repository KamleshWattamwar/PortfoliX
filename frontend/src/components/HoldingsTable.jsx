import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Layers, Layers2 } from 'lucide-react';

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
          <Layers size={18} color="var(--accent-indigo)" />
          Active Holdings & Positions ({holdings.length})
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Consolidated ticker positions
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
              <th style={{ textAlign: 'right' }}>Weight</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="mono-text" style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                          {h.ticker}
                        </span>
                        {hasMultipleLots && (
                          <span 
                            className="badge badge-neutral" 
                            style={{ 
                              fontSize: '0.65rem', 
                              padding: '0.1rem 0.4rem', 
                              background: 'rgba(99, 102, 241, 0.15)', 
                              border: '1px solid rgba(99, 102, 241, 0.35)', 
                              color: '#a5b4fc' 
                            }}
                            title={`Blended average purchase price across ${h.lot_count} separate buy lots`}
                          >
                            <Layers2 size={10} style={{ marginRight: '0.2rem' }} />
                            {h.lot_count} lots
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        NSE India
                      </span>
                    </div>
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '500' }}>
                    {h.quantity}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {formatINR(h.buy_price)}
                    {hasMultipleLots && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>
                        (blended)
                      </span>
                    )}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {formatINR(h.current_price)}
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '700' }}>
                    {formatINR(h.current_value)}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                      <span className="mono-text" style={{ 
                        fontWeight: '700', 
                        color: isProfit ? 'var(--accent-emerald)' : 'var(--accent-rose)' 
                      }}>
                        {isProfit ? '+' : ''}{formatINR(h.pnl)}
                      </span>
                      <span className={`badge ${isProfit ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                        {isProfit ? '+' : ''}{h.pnl_percent.toFixed(2)}%
                      </span>
                    </div>
                  </td>

                  <td className="mono-text" style={{ textAlign: 'right', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {(h.weight * 100).toFixed(1)}%
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.35rem 0.6rem', borderRadius: '6px' }}
                      onClick={() => handleDeleteClick(h)}
                      disabled={loading}
                      title={`Delete all lots for ${h.ticker}`}
                    >
                      <Trash2 size={13} />
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
