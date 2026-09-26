import React from 'react';
import { Grid, HelpCircle } from 'lucide-react';

const getCorrelationColor = (val) => {
  if (val === 1.0) return 'rgba(99, 102, 241, 0.4)'; // Self correlation
  if (val >= 0.75) return 'rgba(244, 63, 94, 0.5)'; // Very high correlation (red)
  if (val >= 0.5) return 'rgba(245, 158, 11, 0.4)';  // Moderate correlation (amber)
  if (val >= 0.2) return 'rgba(139, 92, 246, 0.35)'; // Low positive (purple)
  if (val >= 0) return 'rgba(6, 182, 212, 0.25)';   // Weak positive (cyan)
  return 'rgba(16, 185, 129, 0.35)';                // Negative correlation (emerald - great diversification!)
};

const getCorrelationTextColor = (val) => {
  if (val >= 0.75) return '#fca5a5';
  if (val >= 0.5) return '#fcd34d';
  if (val < 0) return '#6ee7b7';
  return '#e2e8f0';
};

export default function CorrelationHeatmap({ matrix, tickers }) {
  if (!matrix || !tickers || tickers.length === 0) return null;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Grid size={18} color="var(--accent-indigo)" />
          Pairwise Correlation Matrix
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Daily returns cross-asset co-movement (-1.0 to +1.0)
        </span>
      </div>

      <div style={{ padding: '1.25rem', overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '4px', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.5rem', background: 'transparent' }}></th>
              {tickers.map((t) => (
                <th key={t} className="mono-text" style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '700' }}>
                  {t.replace('.NS', '').replace('.BO', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowTicker) => (
              <tr key={rowTicker}>
                <th className="mono-text" style={{ padding: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: '700' }}>
                  {rowTicker.replace('.NS', '').replace('.BO', '')}
                </th>
                {tickers.map((colTicker) => {
                  const val = matrix[rowTicker]?.[colTicker] ?? 0;
                  const bgColor = getCorrelationColor(val);
                  const textColor = getCorrelationTextColor(val);

                  return (
                    <td
                      key={colTicker}
                      title={`${rowTicker} vs ${colTicker}: ${val.toFixed(2)}`}
                      style={{
                        background: bgColor,
                        borderRadius: '8px',
                        padding: '0.65rem 0.4rem',
                        transition: 'all 0.15s ease',
                        cursor: 'default'
                      }}
                    >
                      <span className="mono-text" style={{ fontSize: '0.8rem', fontWeight: '700', color: textColor }}>
                        {val.toFixed(2)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(16, 185, 129, 0.5)' }} />
            Negative (&lt; 0.0)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(6, 182, 212, 0.4)' }} />
            Low (0.0 – 0.5)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(245, 158, 11, 0.5)' }} />
            Moderate (0.5 – 0.75)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(244, 63, 94, 0.6)' }} />
            High (&gt; 0.75)
          </div>
        </div>

      </div>
    </div>
  );
}
