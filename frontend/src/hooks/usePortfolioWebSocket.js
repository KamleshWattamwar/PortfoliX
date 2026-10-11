import { useEffect, useState } from 'react';
import { TOKEN_KEY } from '../api/client';

// http://localhost:8000 -> ws://localhost:8000
const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws');
const HEARTBEAT_MS = 25000;   // send "ping" so idle connections aren't dropped
const MAX_BACKOFF_MS = 30000; // never wait longer than 30s between retries

export function usePortfolioWebSocket(enabled = true) {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let ws;
    let retries = 0;
    let stopped = false;
    let reconnectTimer;
    let heartbeatTimer;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/ws/portfolio?token=${token}`);

      ws.onopen = () => {
        retries = 0; // connected again, reset the backoff
        setIsConnected(true);
        heartbeatTimer = setInterval(() => ws.send('ping'), HEARTBEAT_MS);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.type === 'PRICE_TICK') {
          setPrices((prev) => ({ ...prev, ...msg.prices }));
          setLastUpdate(msg.timestamp);
        }
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        clearInterval(heartbeatTimer);
        if (stopped || event.code === 1008) return; // we closed it, or auth failed: don't retry

        const delay = Math.min(1000 * 2 ** retries, MAX_BACKOFF_MS); // 1s, 2s, 4s, 8s...
        retries += 1;
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      clearInterval(heartbeatTimer);
      ws?.close();
    };
  }, [enabled]);

  return { prices, isConnected, lastUpdate };
}