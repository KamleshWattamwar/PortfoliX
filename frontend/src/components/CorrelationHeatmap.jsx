import React from 'react';
import { Grid, HelpCircle } from 'lucide-react';

const getCorrelationColor = (val) => {
  if (val === 1.0) return '#eff6ff'; // Self correlation (clean light blue)
  if (val >= 0.75) return '#fef2f2'; // High correlation / co-movement risk (soft red)
  if (val >= 0.5) return '#fffbeb';  // Moderate correlation (soft amber)
  if (val >= 0.2) return '#f8fafc'; // Low positive (clean slate)
  if (val >= 0) return '#f1f5f9';   // Weak positive (light slate)
  return '#f0fdf4';                // Negative correlation (soft green - diversification!)
};

const getCorrelationBorder = (val) => {
  if (val === 1.0) return '1px solid #bfdbfe';
  if (val >= 0.75) return '1px solid #fecaca';
  if (val >= 0.5) return '1px solid #fde68a';
  if (val < 0) return '1px solid #bbf7d0';
  return '1px solid #e2e8f0';
};

const getCorrelationTextColor = (val) => {
  if (val === 1.0) return '#1d4ed8';
  if (val >= 0.75) return '#b91c1c';
  if (val >= 0.5) return '#b45309';
  if (val < 0) return '#15803d';
  return '#334155';
};

export default function CorrelationHeatmap({ matrix, tickers }) {
  if (!matrix || !tickers || tickers.length === 0) return null;

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Grid size={22} color="#2563eb" />
          Pairwise Correlation Matrix
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Daily returns cross-asset co-movement (-1.0 to +1.0)
        </span>
      </div>

      <div style={{ padding: '2rem', overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px', textAlign: 'center' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.75rem', background: 'transparent' }}></th>
              {tickers.map((t) => (
                <th key={t} className="mono-text" style={{ padding: '0.75rem', fontSize: '0.95rem', color: '#0f172a', fontWeight: '800' }}>
                  {t.replace('.NS', '').replace('.BO', '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tickers.map((rowTicker) => (
              <tr key={rowTicker}>
                <th className="mono-text" style={{ padding: '0.75rem', fontSize: '0.95rem', color: '#0f172a', textAlign: 'right', fontWeight: '800' }}>
                  {rowTicker.replace('.NS', '').replace('.BO', '')}
                </th>
                {tickers.map((colTicker) => {
                  const val = matrix[rowTicker]?.[colTicker] ?? 0;
                  const bgColor = getCorrelationColor(val);
                  const border = getCorrelationBorder(val);
                  const textColor = getCorrelationTextColor(val);

                  return (
                    <td
                      key={colTicker}
                      title={`${rowTicker} vs ${colTicker}: ${val.toFixed(2)}`}
                      style={{
                        background: bgColor,
                        border: border,
                        borderRadius: '10px',
                        padding: '1.15rem 0.85rem',
                        transition: 'all 0.15s ease',
                        cursor: 'default'
                      }}
                    >
                      <span className="mono-text" style={{ fontSize: '1.05rem', fontWeight: '800', color: textColor }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f0fdf4', border: '1px solid #bbf7d0' }} />
            Negative (&lt; 0.0) • Diversification
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f8fafc', border: '1px solid #e2e8f0' }} />
            Low (0.0 – 0.5) • Balanced
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fffbeb', border: '1px solid #fde68a' }} />
            Moderate (0.5 – 0.75)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#475569', background: '#f8fafc', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontWeight: 600 }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fef2f2', border: '1px solid #fecaca' }} />
            High (&gt; 0.75) • Co-movement Risk
          </div>
        </div>

      </div>
    </div>
  );
}
