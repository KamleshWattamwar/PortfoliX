import asyncio
import logging
import time
from datetime import datetime, timezone

import requests
from fastapi import WebSocket

from backend.database import SessionLocal
from backend.models import Holding

logger = logging.getLogger(__name__)

PRICE_TTL = 10       # seconds a live price is reused (separate from the 15-min cache)
PUSH_INTERVAL = 15   # seconds between pushes to clients

_price_cache: dict[str, tuple[float, float]] = {}  # ticker -> (price, fetched_at)


def _fetch_price(ticker: str) -> float:
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}"
    r = requests.get(
        url,
        params={"interval": "1m", "range": "1d"},
        headers={"User-Agent": "Mozilla/5.0"},
        timeout=5,
    )
    r.raise_for_status()
    return r.json()["chart"]["result"][0]["meta"]["regularMarketPrice"]


async def get_live_prices(tickers: set[str]) -> dict[str, float]:
    """Fetch each ticker once; reuse the price for PRICE_TTL seconds."""
    now = time.time()
    stale = [t for t in tickers if t not in _price_cache or now - _price_cache[t][1] > PRICE_TTL]

    results = await asyncio.gather(
        *(asyncio.to_thread(_fetch_price, t) for t in stale),
        return_exceptions=True,
    )
    for ticker, res in zip(stale, results):
        if isinstance(res, Exception):
            logger.warning("Price fetch failed for %s: %s", ticker, res)  # keep last known price
        else:
            _price_cache[ticker] = (res, now)

    return {t: _price_cache[t][0] for t in tickers if t in _price_cache}


def _user_tickers(user_id: int) -> set[str]:
    db = SessionLocal()
    try:
        return {h.ticker for h in db.query(Holding).filter(Holding.user_id == user_id)}
    finally:
        db.close()


class LiveFeed:
    """One background loop for ALL connections, not one per connection."""

    def __init__(self):
        self.connections: dict[WebSocket, int] = {}  # websocket -> user_id
        self._task: asyncio.Task | None = None

    async def connect(self, ws: WebSocket, user_id: int):
        await ws.accept()
        self.connections[ws] = user_id
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run())

    def disconnect(self, ws: WebSocket):
        self.connections.pop(ws, None)

    async def _run(self):
        while self.connections:
            try:
                await self._tick()
            except Exception:
                logger.exception("Live feed tick failed")  # skip this tick, keep looping
            await asyncio.sleep(PUSH_INTERVAL)

    async def _tick(self):
        user_tickers = {uid: _user_tickers(uid) for uid in set(self.connections.values())}
        prices = await get_live_prices(set().union(*user_tickers.values()))
        timestamp = datetime.now(timezone.utc).isoformat()

        for ws, uid in list(self.connections.items()):
            payload = {
                "type": "PRICE_TICK",
                "timestamp": timestamp,
                "prices": {t: prices[t] for t in user_tickers[uid] if t in prices},
            }
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(ws)


feed = LiveFeed()