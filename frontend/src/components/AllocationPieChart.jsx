import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const PALETTE = [
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#84cc16', // Lime
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-recharts-tooltip">
        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#ffffff', marginBottom: '0.2rem' }}>
          {data.ticker}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Allocation: <span className="mono-text" style={{ color: '#38bdf8', fontWeight: '700' }}>{(data.weight * 100).toFixed(1)}%</span>
        </div>
        {data.valueINR && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Valuation: <span className="mono-text">₹{data.valueINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default function AllocationPieChart({ weights, summaryHoldings }) {
  if (!weights || Object.keys(weights).length === 0) return null;

  const data = Object.entries(weights).map(([ticker, weight]) => {
    const holdingMatch = summaryHoldings?.find(h => h.ticker === ticker);
    return {
      name: ticker,
      ticker: ticker,
      weight: weight,
      value: Number((weight * 100).toFixed(2)),
      valueINR: holdingMatch?.current_value || 0,
    };
  }).sort((a, b) => b.value - a.value);

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="panel-header">
        <div className="panel-title">
          <PieIcon size={18} color="var(--accent-cyan)" />
          Asset Allocation Breakdown
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Value-weighted portfolio shares
        </span>
      </div>

      <div style={{ padding: '1.25rem', flex: 1, minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              stroke="#0a0d14"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PALETTE[index % PALETTE.length]} 
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
          {data.map((item, idx) => (
            <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: PALETTE[idx % PALETTE.length] }} />
              <span className="mono-text" style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{item.ticker}</span>
              <span style={{ color: 'var(--text-muted)' }}>({item.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
