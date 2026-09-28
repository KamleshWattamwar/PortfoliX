import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Search, CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { searchTickers } from '../api/client';

const QUICK_TICKERS = [
  { label: 'RELIANCE', symbol: 'RELIANCE.NS' },
  { label: 'TCS', symbol: 'TCS.NS' },
  { label: 'HDFC BANK', symbol: 'HDFCBANK.NS' },
  { label: 'INFOSYS', symbol: 'INFY.NS' },
  { label: 'ICICI BANK', symbol: 'ICICIBANK.NS' },
  { label: 'TATA MOTORS', symbol: 'TATAMOTORS.NS' },
  { label: 'ADANI POWER', symbol: 'ADANIPOWER.NS' },
  { label: 'L&T', symbol: 'LT.NS' },
  { label: 'ITC', symbol: 'ITC.NS' },
  { label: 'SUZLON', symbol: 'SUZLON.NS' },
  { label: 'ZOMATO', symbol: 'ZOMATO.NS' },
];

export default function HoldingsFormModal({ isOpen, onClose, onAddHolding, loading }) {
  const [ticker, setTicker] = useState('');
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [error, setError] = useState('');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setTicker('');
      setSelectedStock(null);
      setQuantity('');
      setBuyPrice('');
      setBuyDate('');
      setError('');
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, [isOpen]);

  // Click outside listener for dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleTickerChange = (e) => {
    const val = e.target.value;
    setTicker(val);
    setSelectedStock(null);
    setHighlightedIndex(-1);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!val || val.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTickers(val);
        setSuggestions(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.warn('Ticker search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);
  };

  const handleSelectSuggestion = (stock) => {
    setTicker(stock.symbol);
    setSelectedStock(stock);
    setShowDropdown(false);
    setSuggestions([]);
    setError('');
  };

  const handleQuickSelect = (item) => {
    setTicker(item.symbol);
    setSelectedStock({
      symbol: item.symbol,
      name: item.label,
      exchange: item.symbol.endsWith('.BO') ? 'BSE' : 'NSE',
    });
    setShowDropdown(false);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!ticker.trim()) {
      setError('Please enter a stock symbol (e.g. RELIANCE, ADANIPOWER, TCS.NS).');
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
      setSelectedStock(null);
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        
        {/* Header */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={18} color="var(--accent-indigo)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Add Stock Position</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Instant ticker lookup with live NSE/BSE pricing</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          
          {error && (
            <div className="badge badge-negative" style={{ width: '100%', padding: '0.7rem 0.9rem', marginBottom: '1.2rem', fontSize: '0.8rem', lineHeight: '1.4' }}>
              {error}
            </div>
          )}

          {/* Quick symbol picker */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.45rem', fontWeight: 500 }}>
              Popular Indian Stocks:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {QUICK_TICKERS.map((item) => {
                const isSelected = ticker === item.symbol || ticker === item.label;
                return (
                  <button
                    key={item.symbol}
                    type="button"
                    onClick={() => handleQuickSelect(item)}
                    style={{
                      background: isSelected ? 'var(--accent-indigo)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      border: `1px solid ${isSelected ? 'var(--accent-indigo)' : 'var(--border-subtle)'}`,
                      borderRadius: '6px',
                      padding: '0.25rem 0.6rem',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: isSelected ? 600 : 400,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Symbol / Ticker with Autocomplete */}
          <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Stock Symbol or Company Name *</span>
              {selectedStock && (
                <span style={{ fontSize: '0.7rem', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={12} /> Verified Symbol
                </span>
              )}
            </label>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input mono-text"
                placeholder="Type symbol or company (e.g. ADANI POWER, TCS, INFY)..."
                value={ticker}
                onChange={handleTickerChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                required
                autoComplete="off"
                style={{
                  paddingRight: '2.5rem',
                  borderColor: selectedStock ? 'rgba(34, 197, 94, 0.5)' : undefined,
                }}
              />
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>
                {isSearching ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
              </div>
            </div>

            {/* Selected stock confirmation pill */}
            {selectedStock && (
              <div style={{ marginTop: '0.4rem', padding: '0.35rem 0.65rem', background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '6px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{selectedStock.name}</span>
                <span style={{ color: 'var(--accent-green)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedStock.symbol} ({selectedStock.exchange || 'NSE'})</span>
              </div>
            )}

            {/* Autocomplete Dropdown */}
            {showDropdown && suggestions.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: '4px',
                background: '#131722',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                zIndex: 100,
                maxHeight: '220px',
                overflowY: 'auto',
              }}>
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === highlightedIndex;
                  return (
                    <div
                      key={`${item.symbol}-${idx}`}
                      onClick={() => handleSelectSuggestion(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      style={{
                        padding: '0.6rem 0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: isHighlighted ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        borderBottom: idx < suggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <Building2 size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                            {item.symbol}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.65rem',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          background: item.exchange === 'NSE' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                          color: item.exchange === 'NSE' ? '#60a5fa' : '#facc15',
                          fontWeight: 600,
                          fontFamily: 'var(--font-mono)',
                        }}>
                          {item.exchange || 'NSE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!selectedStock && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                Type full or partial name (e.g. <span style={{ color: 'var(--text-secondary)' }}>ADANI POWER</span>, <span style={{ color: 'var(--text-secondary)' }}>TATA MOTORS</span>). Auto-resolves to official NSE ticker (.NS).
              </span>
            )}
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

