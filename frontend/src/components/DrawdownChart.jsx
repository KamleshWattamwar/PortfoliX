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
      <div className="custom-recharts-tooltip">
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
          Date: <span className="mono-text" style={{ color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-rose)' }}>
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
          <TrendingDown size={18} color="var(--accent-rose)" />
          Historical Portfolio Drawdown
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max Fall from Peak:</span>
          <span className="badge badge-negative mono-text" style={{ fontSize: '0.75rem' }}>
            {maxDdPercent}%
          </span>
        </div>
      </div>

      <div style={{ padding: '1.25rem 1rem 0.5rem 0.5rem', width: '100%', height: '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-rose)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--accent-rose)" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" vertical={false} />
            
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => {
                // e.g. 2024-05-12 -> May 24
                try {
                  const parts = val.split('-');
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return `${monthNames[parseInt(parts[1], 10) - 1]} '${parts[0].slice(2)}`;
                } catch {
                  return val;
                }
              }}
              minTickGap={40}
            />

            <YAxis 
              tickLine={false}
              axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
              domain={['dataMin', 0]}
            />

            <Tooltip content={<CustomDrawdownTooltip />} />

            <Area 
              type="monotone" 
              dataKey="drawdown" 
              stroke="var(--accent-rose)" 
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
