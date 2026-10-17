import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ConcentrationBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div style={{
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      padding: '1.35rem 1.6rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      boxShadow: '0 1px 3px rgba(220, 38, 38, 0.08)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#fee2e2',
        border: '1px solid #fca5a5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertTriangle size={24} color="#dc2626" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '1.05rem', fontWeight: '800', color: '#b91c1c' }}>
            Portfolio Concentration Alert (&gt;30% Allocation Limit)
          </span>
          <span className="badge badge-negative" style={{ fontSize: '0.78rem', padding: '0.2rem 0.55rem' }}>
            Risk Factor
          </span>
        </div>
        
        <div style={{ fontSize: '0.92rem', color: '#7f1d1d', display: 'flex', flexDirection: 'column', gap: '0.3rem', lineHeight: '1.6' }}>
          {warnings.map((w, idx) => (
            <div key={idx}>
              <strong>{w.ticker}</strong> represents <strong>{(w.weight * 100).toFixed(1)}%</strong> of your total portfolio value. Overconcentration in a single asset significantly amplifies unsystematic risk.
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
