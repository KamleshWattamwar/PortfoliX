"""
Market Data Service for PortfoliX.
Fetches daily prices via Yahoo Finance API with in-memory 15-minute TTL caching,
Indian NSE ticker normalization, and resilient error isolation so single-ticker failures never crash portfolio calculations.
"""

import logging
import time
import urllib.parse
from typing import Dict, List, Optional, Set, Tuple
import pandas as pd
import requests
import yfinance as yf

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 900  # 15 minutes TTL as specified in README
DEFAULT_BENCHMARK = "^NSEI"  # NIFTY 50 benchmark index
DEFAULT_LOOKBACK = "1y"

# In-memory price cache: { ticker: (timestamp, pd.Series_of_close_prices, latest_price) }
_PRICE_CACHE: Dict[str, Tuple[float, pd.Series, float]] = {}

SESSION_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def normalize_ticker(ticker: str) -> str:
    """
    Normalizes Indian stock tickers.
    If ticker does not have .NS, .BO or start with ^ (index), default to .NS.
    """
    clean = ticker.strip().upper()
    if clean.startswith("^"):
        return clean
    if "." in clean:
        return clean
    return f"{clean}.NS"


def get_cached_ticker_data(ticker: str) -> Optional[Tuple[pd.Series, float]]:
    """Returns cached (close_series, latest_price) if within TTL."""
    now = time.time()
    if ticker in _PRICE_CACHE:
        cached_time, series, latest_p = _PRICE_CACHE[ticker]
        if now - cached_time < CACHE_TTL_SECONDS:
            return series, latest_p
    return None


def set_cached_ticker_data(ticker: str, series: pd.Series, latest_price: float):
    """Caches ticker price series and latest price with current timestamp."""
    _PRICE_CACHE[ticker] = (time.time(), series, latest_price)


def _fetch_from_chart_api(norm_ticker: str, range_str: str = "1y") -> Tuple[Optional[pd.Series], Optional[float], Optional[str]]:
    """Direct fast query to Yahoo Finance chart API."""
    try:
        encoded = urllib.parse.quote(norm_ticker)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range={range_str}&interval=1d"
        response = requests.get(url, headers=SESSION_HEADERS, timeout=12)
        
        if response.status_code != 200:
            return None, None, f"HTTP {response.status_code} received for ticker {norm_ticker}"
        
        data = response.json()
        chart = data.get("chart", {})
        
        if chart.get("error"):
            err_desc = chart["error"].get("description", "Unknown error")
            return None, None, f"Market data error for '{norm_ticker}': {err_desc}"
        
        results = chart.get("result")
        if not results or len(results) == 0:
            return None, None, f"No chart results returned for '{norm_ticker}'"
        
        res = results[0]
        timestamps = res.get("timestamp", [])
        indicators = res.get("indicators", {}).get("quote", [{}])[0]
        closes = indicators.get("close", [])
        
        if not timestamps or not closes:
            return None, None, f"Empty price series for '{norm_ticker}'"
        
        dates = pd.to_datetime(timestamps, unit="s").tz_localize(None).normalize()
        series = pd.Series(closes, index=dates, name=norm_ticker).dropna()
        
        if series.empty:
            return None, None, f"No valid closing prices found for '{norm_ticker}'"
        
        # Deduplicate dates
        series = series[~series.index.duplicated(keep="last")]
        
        # Meta regularMarketPrice or last close
        meta = res.get("meta", {})
        latest_price = float(meta.get("regularMarketPrice") or series.iloc[-1])
        
        return series, latest_price, None

    except Exception as e:
        return None, None, f"Exception fetching chart data for '{norm_ticker}': {str(e)}"


def fetch_single_ticker_data(
    ticker: str, period: str = DEFAULT_LOOKBACK
) -> Tuple[Optional[pd.Series], Optional[float], Optional[str]]:
    """
    Fetches daily close price series and latest price for a single ticker.
    Checks cache first. Returns (series, latest_price, error_msg).
    """
    norm_ticker = normalize_ticker(ticker)
    
    # Check cache
    cached = get_cached_ticker_data(norm_ticker)
    if cached:
        return cached[0], cached[1], None

    # Primary: Fast Direct Chart API
    series, latest_price, err = _fetch_from_chart_api(norm_ticker, range_str=period)
    
    # Fallback to yfinance if chart API failed
    if err or series is None or latest_price is None:
        try:
            yf_ticker = yf.Ticker(norm_ticker)
            hist = yf_ticker.history(period=period, auto_adjust=True)
            if not hist.empty and "Close" in hist.columns:
                close_series = hist["Close"].dropna()
                if not close_series.empty:
                    close_series.index = pd.to_datetime(close_series.index).tz_localize(None).normalize()
                    close_series = close_series[~close_series.index.duplicated(keep="last")]
                    latest_price = float(close_series.iloc[-1])
                    series = close_series
                    err = None
        except Exception:
            pass

    if err or series is None or latest_price is None:
        return None, None, err or f"Failed to fetch market quotes for '{ticker}'."

    # Save to in-memory cache
    set_cached_ticker_data(norm_ticker, series, latest_price)
    return series, latest_price, None


def fetch_portfolio_market_data(
    tickers: List[str],
    include_benchmark: bool = True,
    benchmark_ticker: str = DEFAULT_BENCHMARK,
    period: str = DEFAULT_LOOKBACK,
) -> Tuple[pd.DataFrame, Dict[str, float], Optional[pd.Series], List[str]]:
    """
    Fetches historical daily prices for all requested portfolio tickers and benchmark.
    Aligns all series using an inner join on dates.
    """
    raw_series_dict: Dict[str, pd.Series] = {}
    latest_prices: Dict[str, float] = {}
    errors: List[str] = []
    
    unique_tickers = list(dict.fromkeys(tickers))
    
    for ticker in unique_tickers:
        series, latest_p, err = fetch_single_ticker_data(ticker, period=period)
        if err:
            errors.append(err)
        elif series is not None and latest_p is not None:
            raw_series_dict[ticker] = series
            latest_prices[ticker] = latest_p
    
    benchmark_series: Optional[pd.Series] = None
    if include_benchmark:
        b_series, _, b_err = fetch_single_ticker_data(benchmark_ticker, period=period)
        if b_err:
            errors.append(f"Benchmark notice: {b_err}")
        else:
            benchmark_series = b_series

    if not raw_series_dict:
        return pd.DataFrame(), latest_prices, benchmark_series, errors

    # Inner join alignment across tickers
    prices_df = pd.DataFrame(raw_series_dict)
    
    if benchmark_series is not None:
        aligned_df = prices_df.join(benchmark_series.rename("_BENCHMARK_"), how="inner").dropna()
        if not aligned_df.empty and len(aligned_df) >= 5:
            prices_df = aligned_df.drop(columns=["_BENCHMARK_"])
            benchmark_series = aligned_df["_BENCHMARK_"]
        else:
            prices_df = prices_df.dropna()
    else:
        prices_df = prices_df.dropna()

    return prices_df, latest_prices, benchmark_series, errors


def clear_cache():
    """Utility to clear market data cache."""
    _PRICE_CACHE.clear()
