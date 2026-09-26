import React from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ConcentrationBanner({ warnings }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.15), rgba(244, 63, 94, 0.1))',
      border: '1px solid rgba(245, 158, 11, 0.4)',
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      boxShadow: '0 4px 20px rgba(245, 158, 11, 0.1)',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        background: 'rgba(245, 158, 11, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <AlertTriangle size={20} color="#fbbf24" />
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#fbbf24' }}>
            Portfolio Concentration Alert (&gt;30% Allocation Limit)
          </span>
          <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
            Risk Factor
          </span>
        </div>
        
        <div style={{ fontSize: '0.8rem', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
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
