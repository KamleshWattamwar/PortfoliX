import React from 'react';

export default function LiveBadge({ isConnected }) {
  const color = isConnected ? '#22c55e' : '#eab308';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.25rem 0.7rem',
        borderRadius: '999px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color,
        border: `1px solid ${color}`,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
      {isConnected ? 'LIVE' : 'CONNECTING...'}
    </span>
  );
}