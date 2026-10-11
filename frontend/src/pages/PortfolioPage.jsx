import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePortfolioWebSocket } from '../hooks/usePortfolioWebSocket';
import LiveBadge from '../components/LiveBadge';
import { getPortfolioSummary, getPortfolioRisk } from '../api/client';
import { usePortfolio } from '../context/PortfolioContext';
import SummaryCards from '../components/SummaryCards';
import HoldingsTable from '../components/HoldingsTable';
import AllocationPieChart from '../components/AllocationPieChart';
import EmptyState from '../components/EmptyState';
import { RefreshCw, AlertCircle } from 'lucide-react';


export default function PortfolioPage() {
  const { hasHoldings, refreshTrigger, deleteHoldingByTicker, loadDemo, actionLoading } = usePortfolio();
  const { prices, isConnected } = usePortfolioWebSocket(hasHoldings);

  const [summary, setSummary] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!hasHoldings) {
      setSummary(null);
      setRisk(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [sumData, riskData] = await Promise.all([
        getPortfolioSummary(),
        getPortfolioRisk(),
      ]);
      setSummary(sumData);
      setRisk(riskData);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.detail || err.message || 'Failed to load portfolio summary.');
      }
    } finally {
      setLoading(false);
    }
  }, [hasHoldings]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const liveHoldings = useMemo(() => {
  if (!summary?.holdings) return null;

  const updated = summary.holdings.map((h) => {
    const price = prices[h.ticker] ?? h.current_price; // live price, else the REST one
    const value = price * h.quantity;
    const cost = h.buy_price * h.quantity;
    return {
      ...h,
      current_price: price,
      current_value: value,
      pnl: value - cost,
      pnl_percent: cost > 0 ? ((value - cost) / cost) * 100 : 0,
    };
  });

  const total = updated.reduce((sum, h) => sum + h.current_value, 0);
  return updated.map((h) => ({ ...h, weight: total > 0 ? h.current_value / total : 0 }));
  }, [summary, prices]);

  const liveSummary = useMemo(() => {
  if (!summary || !liveHoldings) return summary;

  const totalValue = liveHoldings.reduce((sum, h) => sum + h.current_value, 0);
  const totalPnl = totalValue - summary.total_invested;

  return {
      ...summary,
      total_current_value: totalValue,
      total_pnl: totalPnl,
      total_pnl_percent: summary.total_invested > 0 ? (totalPnl / summary.total_invested) * 100 : 0,
    };
  }, [summary, liveHoldings]);
  
  if (!hasHoldings && !loading) {
    return (
      <EmptyState
        onOpenAddModal={() => document.querySelector('.topbar-actions button:last-child')?.click()}
        onOpenCsvModal={() => document.querySelector('.topbar-actions button:nth-last-child(2)')?.click()}
        onLoadDemo={loadDemo}
        loading={actionLoading}
      />
    );
  }

  return (
  <div className="page-container">
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <LiveBadge isConnected={isConnected} />
    </div>

    {error && (
      <div className="badge badge-negative" style={{ padding: '0.8rem 1.25rem', fontSize: '0.85rem', width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>
    )}


      {loading && !summary ? (
        <div className="loading-container">
          <RefreshCw size={32} className="spin-anim" style={{ color: 'var(--accent-indigo)' }} />
          <p>Fetching real-time market valuations from NSE...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <SummaryCards summary={liveSummary} risk={risk} />

          {/* Allocation Donut & Holdings Table in split or vertical layout */}
          <div className="analytics-grid">
            <AllocationPieChart 
              weights={risk?.weights} 
              summaryHoldings={summary?.holdings} 
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Portfolio Overview
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                  Track your equity portfolio's market value, unrealized returns, and single-stock capital allocation. Use the <strong>Risk Metrics</strong> tab to inspect Beta vs NIFTY 50 and volatility.
                </p>
              </div>

              {liveHoldings && (
                <HoldingsTable
                holdings={liveHoldings}
                onDelete={deleteHoldingByTicker}
                loading={actionLoading}
                />
)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
