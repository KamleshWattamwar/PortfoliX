import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const PALETTE = [
  '#2563eb', // Royal Blue
  '#0284c7', // Sky Blue
  '#0f172a', // Dark Slate
  '#16a34a', // Emerald Green
  '#3b82f6', // Bright Blue
  '#0d9488', // Teal
  '#64748b', // Slate Gray
  '#1d4ed8', // Deep Blue
  '#059669', // Forest Green
  '#334155', // Charcoal
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-recharts-tooltip" style={{ background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -4px rgba(0,0,0,0.1)' }}>
        <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.2rem' }}>
          {data.ticker}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
          Allocation: <span className="mono-text" style={{ color: '#2563eb', fontWeight: '700' }}>{(data.weight * 100).toFixed(1)}%</span>
        </div>
        {data.valueINR && (
          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
            Valuation: <span className="mono-text" style={{ color: '#0f172a', fontWeight: '600' }}>₹{data.valueINR.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
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
          <PieIcon size={22} color="#2563eb" />
          Asset Allocation Breakdown
        </div>
        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          Value-weighted portfolio shares
        </span>
      </div>

      <div style={{ padding: '1.75rem', flex: 1, minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={80}
              outerRadius={125}
              paddingAngle={2.5}
              dataKey="value"
              stroke="#ffffff"
              strokeWidth={3}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem 1.25rem', justifyContent: 'center', marginTop: '1.25rem' }}>
          {data.map((item, idx) => (
            <div key={item.ticker} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: PALETTE[idx % PALETTE.length] }} />
              <span className="mono-text" style={{ color: '#0f172a', fontWeight: '800' }}>{item.ticker}</span>
              <span style={{ color: '#64748b', fontWeight: 500 }}>({item.value}%)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
