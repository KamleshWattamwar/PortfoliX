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

          {/* Allocation & Risk Intelligence Row */}
          <div className="analytics-grid">
            <AllocationPieChart 
              weights={risk?.weights} 
              summaryHoldings={summary?.holdings} 
            />

            {/* Orion-inspired Executive Intelligence Card */}
            <div className="glass-panel" style={{ padding: '2.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#2563eb' }}>
                    Portfolio Intelligence
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                    Benchmark: ^NSEI
                  </span>
                </div>

                <h3 style={{ fontSize: '1.45rem', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em', marginBottom: '0.75rem', lineHeight: 1.3 }}>
                  Run Stress Testing & Risk Analytics
                </h3>
                <p style={{ fontSize: '0.98rem', color: '#475569', lineHeight: '1.65', marginBottom: '1.5rem' }}>
                  Evaluate downside vulnerability against the Indian broader market. PortfoliX calculates annualized volatility, beta sensitivity against NIFTY 50, and 1-year peak-to-trough drawdowns using historical daily prices.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '1.25rem 1.4rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Active Assets</div>
                    <div className="mono-text" style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', marginTop: '0.15rem' }}>
                      {summary?.holdings_count || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Market Feed</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#16a34a', marginTop: '0.3rem' }}>
                      NSE / BSE
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Risk Horizon</div>
                    <div style={{ fontSize: '0.98rem', fontWeight: '800', color: '#2563eb', marginTop: '0.3rem' }}>
                      252 Trading Days
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <a 
                  href="/risk" 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    color: '#2563eb', 
                    fontWeight: 800, 
                    fontSize: '0.98rem', 
                    textDecoration: 'none' 
                  }}
                >
                  Explore Risk Analytics →
                </a>
                <a 
                  href="/faq" 
                  style={{ 
                    fontSize: '0.88rem', 
                    color: '#64748b', 
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  Methodology Guide
                </a>
              </div>
            </div>
          </div>

          {/* Full-width Holdings Table */}
          {liveHoldings && (
            <HoldingsTable
              holdings={liveHoldings}
              onDelete={deleteHoldingByTicker}
              loading={actionLoading}
            />
          )}
        </>
      )}
    </div>
  );
}
