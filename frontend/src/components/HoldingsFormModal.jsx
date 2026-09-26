import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

const QUICK_TICKERS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'TATAMOTORS', 'LT', 'ITC', 'BHARTIARTL'
];

export default function HoldingsFormModal({ isOpen, onClose, onAddHolding, loading }) {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!ticker.trim()) {
      setError('Please enter a stock symbol (e.g. RELIANCE, TCS.NS).');
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be a positive number.');
      return;
    }
    const price = parseFloat(buyPrice);
    if (isNaN(price) || price <= 0) {
      setError('Buy price must be a positive number.');
      return;
    }

    try {
      await onAddHolding({
        ticker: ticker.trim().toUpperCase(),
        quantity: qty,
        buy_price: price,
        buy_date: buyDate ? buyDate : null,
      });
      // reset form
      setTicker('');
      setQuantity('');
      setBuyPrice('');
      setBuyDate('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to add holding.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--accent-indigo)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Add Stock Position</h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          
          {error && (
            <div className="badge badge-negative" style={{ width: '100%', padding: '0.6rem 0.8rem', marginBottom: '1rem', fontSize: '0.8rem' }}>
              {error}
            </div>
          )}

          {/* Quick symbol picker */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
              Popular NIFTY 50 Tickers:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {QUICK_TICKERS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTicker(t)}
                  style={{
                    background: ticker === t ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.05)',
                    color: ticker === t ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Stock Symbol / Ticker *</label>
            <input
              type="text"
              className="form-input mono-text"
              placeholder="e.g. RELIANCE, TCS, INFY.NS"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              required
            />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Auto-resolves to NSE (adds .NS). For BSE, enter suffix (e.g. TCS.BO).
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Quantity (Shares) *</label>
              <input
                type="number"
                step="any"
                min="0.0001"
                className="form-input mono-text"
                placeholder="e.g. 50"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Avg Buy Price (₹) *</label>
              <input
                type="number"
                step="any"
                min="0.01"
                className="form-input mono-text"
                placeholder="e.g. 2450.00"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Purchase Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={buyDate}
              onChange={(e) => setBuyDate(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding Position...' : 'Add Position'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
