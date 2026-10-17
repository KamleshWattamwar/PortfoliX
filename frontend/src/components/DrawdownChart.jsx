import React from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingDown } from 'lucide-react';

const CustomDrawdownTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="custom-recharts-tooltip" style={{ background: '#ffffff', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px -4px rgba(0,0,0,0.1)', padding: '0.9rem 1.15rem' }}>
        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.3rem' }}>
          Date: <span className="mono-text" style={{ color: '#0f172a', fontWeight: 700 }}>{label}</span>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#dc2626' }}>
          Drawdown: <span className="mono-text">{(val * 100).toFixed(2)}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function DrawdownChart({ drawdownData }) {
  if (!drawdownData || !drawdownData.dates || drawdownData.dates.length === 0) return null;

  const chartData = drawdownData.dates.map((d, i) => ({
    date: d,
    drawdown: drawdownData.drawdown[i] || 0,
  }));

  const maxDdPercent = (drawdownData.max_drawdown * 100).toFixed(2);

  return (
    <div className="glass-panel">
      <div className="panel-header">
        <div className="panel-title">
          <TrendingDown size={22} color="#dc2626" />
          Historical Portfolio Drawdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Max Fall from Peak:</span>
          <span className="badge badge-negative mono-text" style={{ fontSize: '0.82rem', padding: '0.25rem 0.65rem' }}>
            {maxDdPercent}%
          </span>
        </div>
      </div>

      <div style={{ padding: '1.75rem 1.5rem 1rem 0.5rem', width: '100%', height: '420px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 25, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }}
              tickFormatter={(val) => {
                try {
                  const parts = val.split('-');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${monthNames[parseInt(parts[1], 10) - 1]} '${parts[0].slice(2)}`;
                } catch {
                  return val;
                }
              }}
              minTickGap={45}
            />

            <YAxis 
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 13, fontWeight: 600 }}
              tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              domain={['dataMin', 0]}
            />

            <Tooltip content={<CustomDrawdownTooltip />} />

            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="#dc2626" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#drawdownGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
