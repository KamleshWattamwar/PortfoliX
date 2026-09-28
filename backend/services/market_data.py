"""
Market Data Service for PortfoliX.
Fetches daily prices via Yahoo Finance API with in-memory 15-minute TTL caching,
Indian NSE ticker normalization, search/autocomplete, dynamic resolution,
and resilient error isolation so single-ticker failures never crash portfolio calculations.
"""

import logging
import re
import time
import urllib.parse
from typing import Dict, List, Optional, Set, Tuple
import pandas as pd
import requests
import yfinance as yf

logger = logging.getLogger(__name__)

CACHE_TTL_SECONDS = 900  # 15 minutes TTL as specified in README
NEGATIVE_CACHE_TTL_SECONDS = 180  # 3 minutes for failed tickers to avoid repeated hangs
DEFAULT_BENCHMARK = "^NSEI"  # NIFTY 50 benchmark index
DEFAULT_LOOKBACK = "1y"

# In-memory price cache: { ticker: (timestamp, pd.Series_of_close_prices, latest_price) }
_PRICE_CACHE: Dict[str, Tuple[float, pd.Series, float]] = {}

# In-memory negative cache: { ticker: (timestamp, error_message) }
_NEGATIVE_CACHE: Dict[str, Tuple[float, str]] = {}

# In-memory ticker search cache: { query_lower: (timestamp, results) }
_SEARCH_CACHE: Dict[str, Tuple[float, List[Dict[str, str]]]] = {}

SESSION_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

# Curated Indian stock aliases and variations mapping to official NSE symbols
COMMON_TICKER_MAP: Dict[str, str] = {
    # Adani Group
    "ADANIPOWER": "ADANIPOWER.NS",
    "ADANI-POWER": "ADANIPOWER.NS",
    "ADANIENT": "ADANIENT.NS",
    "ADANI-ENT": "ADANIENT.NS",
    "ADANIENTERPRISES": "ADANIENT.NS",
    "ADANIPORTS": "ADANIPORTS.NS",
    "ADANI-PORTS": "ADANIPORTS.NS",
    "ADANIPORT": "ADANIPORTS.NS",
    "ADANIGREEN": "ADANIGREEN.NS",
    "ADANI-GREEN": "ADANIGREEN.NS",
    "ADANIENERGY": "ADANIENSOL.NS",
    "ADANIENSOL": "ADANIENSOL.NS",
    "ADANITRANS": "ADANIENSOL.NS",
    "ADANITRANSMISSION": "ADANIENSOL.NS",
    "ADANIWILMAR": "AWL.NS",
    "AWL": "AWL.NS",
    "ATGL": "ATGL.NS",
    "ADANIGAS": "ATGL.NS",
    "ADANITOTALGAS": "ATGL.NS",

    # Tata Group
    "TATAMOTORS": "TATAMOTORS.NS",
    "TATA-MOTORS": "TATAMOTORS.NS",
    "TATASTEEL": "TATASTEEL.NS",
    "TATA-STEEL": "TATASTEEL.NS",
    "TATAPOWER": "TATAPOWER.NS",
    "TATA-POWER": "TATAPOWER.NS",
    "TATACONSULTANCY": "TCS.NS",
    "TATACONSULTANCYSERVICES": "TCS.NS",
    "TCS": "TCS.NS",
    "TATACONSUMER": "TATACONSUM.NS",
    "TATACONSUM": "TATACONSUM.NS",
    "TATACHEM": "TATACHEM.NS",
    "TATACOMM": "TATACOMM.NS",
    "TATACOMMUNICATIONS": "TATACOMM.NS",
    "TRENT": "TRENT.NS",
    "VOLTAS": "VOLTAS.NS",

    # Banking & Financial Services
    "HDFCBANK": "HDFCBANK.NS",
    "HDFC-BANK": "HDFCBANK.NS",
    "HDFC": "HDFCBANK.NS",
    "HDFCLIFE": "HDFCLIFE.NS",
    "HDFCAMC": "HDFCAMC.NS",
    "ICICIBANK": "ICICIBANK.NS",
    "ICICI-BANK": "ICICIBANK.NS",
    "ICICIPRULI": "ICICIPRULI.NS",
    "ICICIGI": "ICICIGI.NS",
    "SBIN": "SBIN.NS",
    "SBI": "SBIN.NS",
    "STATEBANK": "SBIN.NS",
    "STATEBANKOFINDIA": "SBIN.NS",
    "SBILIFE": "SBILIFE.NS",
    "SBICARD": "SBICARD.NS",
    "KOTAKBANK": "KOTAKBANK.NS",
    "KOTAK": "KOTAKBANK.NS",
    "KOTAKMAHINDRA": "KOTAKBANK.NS",
    "AXISBANK": "AXISBANK.NS",
    "AXIS": "AXISBANK.NS",
    "INDUSINDBK": "INDUSINDBK.NS",
    "INDUSIND": "INDUSINDBK.NS",
    "BAJFINANCE": "BAJFINANCE.NS",
    "BAJAJFINANCE": "BAJFINANCE.NS",
    "BAJAJ-FINANCE": "BAJFINANCE.NS",
    "BAJAJFINSV": "BAJAJFINSV.NS",
    "BAJAJFINSERV": "BAJAJFINSV.NS",
    "BAJAJ-FINSERV": "BAJAJFINSV.NS",
    "BAJAJAUTO": "BAJAJ-AUTO.NS",
    "BAJAJ-AUTO": "BAJAJ-AUTO.NS",
    "JIOFIN": "JIOFIN.NS",
    "JIOFINANCIAL": "JIOFIN.NS",
    "JIOFINANCIALSERVICES": "JIOFIN.NS",
    "MUTHOOTFIN": "MUTHOOTFIN.NS",
    "MUTHOOTFINANCE": "MUTHOOTFIN.NS",
    "CHOLAFIN": "CHOLAFIN.NS",
    "SHRIRAMFIN": "SHRIRAMFIN.NS",

    # IT & Tech
    "INFY": "INFY.NS",
    "INFOSYS": "INFY.NS",
    "WIPRO": "WIPRO.NS",
    "HCLTECH": "HCLTECH.NS",
    "HCLTECHNOLOGIES": "HCLTECH.NS",
    "TECHM": "TECHM.NS",
    "TECHMAHINDRA": "TECHM.NS",
    "LTIM": "LTIM.NS",
    "LTIMINDTREE": "LTIM.NS",
    "PERSISTENT": "PERSISTENT.NS",
    "COFORGE": "COFORGE.NS",
    "MPHASIS": "MPHASIS.NS",

    # New Age & Consumer Tech
    "ZOMATO": "ZOMATO.NS",
    "PAYTM": "PAYTM.NS",
    "ONE97": "PAYTM.NS",
    "NYKAA": "NYKAA.NS",
    "FSN": "NYKAA.NS",
    "DELHIVERY": "DELHIVERY.NS",
    "POLICYBZR": "POLICYBZR.NS",
    "PBFINTECH": "POLICYBZR.NS",
    "SWIGGY": "SWIGGY.NS",
    "OLAELEC": "OLAELEC.NS",
    "OLAELECTRIC": "OLAELEC.NS",

    # Oil, Gas & Energy
    "RELIANCE": "RELIANCE.NS",
    "RIL": "RELIANCE.NS",
    "RELIANCEINDUSTRIES": "RELIANCE.NS",
    "ONGC": "ONGC.NS",
    "BPCL": "BPCL.NS",
    "BHARATPETROLEUM": "BPCL.NS",
    "IOC": "IOC.NS",
    "INDIANOIL": "IOC.NS",
    "HPCL": "HPCL.NS",
    "HINDPETRO": "HPCL.NS",
    "NTPC": "NTPC.NS",
    "POWERGRID": "POWERGRID.NS",
    "POWERGRIDCORP": "POWERGRID.NS",
    "COALINDIA": "COALINDIA.NS",
    "CIL": "COALINDIA.NS",
    "GAIL": "GAIL.NS",
    "SUZLON": "SUZLON.NS",
    "SUZLONENERGY": "SUZLON.NS",
    "IREDA": "IREDA.NS",
    "NHPC": "NHPC.NS",
    "SJVN": "SJVN.NS",

    # Auto & Industrials
    "LT": "LT.NS",
    "L&T": "LT.NS",
    "LARSEN": "LT.NS",
    "LARSENTOUBRO": "LT.NS",
    "LARSENANDTOUBRO": "LT.NS",
    "M&M": "M&M.NS",
    "MAHINDRA": "M&M.NS",
    "MAHINDRAANDMAHINDRA": "M&M.NS",
    "MARUTI": "MARUTI.NS",
    "MARUTISUZUKI": "MARUTI.NS",
    "HEROMOTOCO": "HEROMOTOCO.NS",
    "HEROHONDA": "HEROMOTOCO.NS",
    "HERO": "HEROMOTOCO.NS",
    "EICHERMOT": "EICHERMOT.NS",
    "EICHERMOTORS": "EICHERMOT.NS",
    "ROYALENFIELD": "EICHERMOT.NS",
    "TVSMOTOR": "TVSMOTOR.NS",
    "ASHOKLEY": "ASHOKLEY.NS",
    "ASHOKLEYLAND": "ASHOKLEY.NS",
    "BEL": "BEL.NS",
    "BHARATELECTRONICS": "BEL.NS",
    "HAL": "HAL.NS",
    "HINDUSTANAERONAUTICS": "HAL.NS",
    "BHEL": "BHEL.NS",
    "SIEMENS": "SIEMENS.NS",
    "ABB": "ABB.NS",

    # Metals & Mining
    "JSWSTEEL": "JSWSTEEL.NS",
    "HINDALCO": "HINDALCO.NS",
    "VEDL": "VEDL.NS",
    "VEDANTA": "VEDL.NS",
    "NMDC": "NMDC.NS",
    "SAIL": "SAIL.NS",
    "JINDALSTEL": "JINDALSTEL.NS",

    # FMCG, Pharma & Telecom
    "ITC": "ITC.NS",
    "HINDUNILVR": "HINDUNILVR.NS",
    "HUL": "HINDUNILVR.NS",
    "HINDUSTANUNILEVER": "HINDUNILVR.NS",
    "NESTLEIND": "NESTLEIND.NS",
    "NESTLE": "NESTLEIND.NS",
    "BRITANNIA": "BRITANNIA.NS",
    "DABUR": "DABUR.NS",
    "MARICO": "MARICO.NS",
    "GODREJCP": "GODREJCP.NS",
    "COLPAL": "COLPAL.NS",
    "VARUNBEV": "VBL.NS",
    "VBL": "VBL.NS",
    "TITAN": "TITAN.NS",
    "ASIANPAINT": "ASIANPAINT.NS",
    "ASIANPAINTS": "ASIANPAINT.NS",
    "BERGEPAINT": "BERGEPAINT.NS",
    "PIDILITIND": "PIDILITIND.NS",
    "PIDILITE": "PIDILITIND.NS",
    "BHARTIARTL": "BHARTIARTL.NS",
    "AIRTEL": "BHARTIARTL.NS",
    "BHARTIAIRTEL": "BHARTIARTL.NS",
    "IDEA": "IDEA.NS",
    "VODAFONEIDEA": "IDEA.NS",
    "SUNPHARMA": "SUNPHARMA.NS",
    "CIPLA": "CIPLA.NS",
    "DRREDDY": "DRREDDY.NS",
    "REDDY": "DRREDDY.NS",
    "DIVISLAB": "DIVISLAB.NS",
    "APOLLOHOSP": "APOLLOHOSP.NS",
    "APOLLOHOSPITALS": "APOLLOHOSP.NS",
    "MANKIND": "MANKIND.NS",
    "ZYDUSLIFE": "ZYDUSLIFE.NS",
    "TORNTPHARM": "TORNTPHARM.NS",
    "LUPIN": "LUPIN.NS",
    "AUROPHARMA": "AUROPHARMA.NS",

    # Cement & Realty
    "ULTRACEMCO": "ULTRACEMCO.NS",
    "ULTRATECH": "ULTRACEMCO.NS",
    "ULTRATECHCEMENT": "ULTRACEMCO.NS",
    "GRASIM": "GRASIM.NS",
    "AMBUJACEM": "AMBUJACEM.NS",
    "ACC": "ACC.NS",
    "DLF": "DLF.NS",
    "GODREJPROP": "GODREJPROP.NS",
    "LODHA": "LODHA.NS",
    "MACROTECH": "LODHA.NS",
}


def _clean_string_for_lookup(text: str) -> str:
    """Removes non-alphanumeric chars and uppercase."""
    return re.sub(r"[^A-Za-z0-9]", "", text).upper()


def normalize_ticker(ticker: str) -> str:
    """
    Normalizes Indian stock tickers and common aliases:
    1. Removes all internal and surrounding whitespace (e.g. 'ADANI POWER' -> 'ADANIPOWER')
    2. Maps common company names & variations (e.g. 'ADANI POWER' -> 'ADANIPOWER.NS', 'SBI' -> 'SBIN.NS')
    3. Handles exchange suffixes (.NS, .BO) and defaults to .NS for Indian stocks.
    """
    if not ticker:
        return ""

    raw = ticker.strip().upper()

    # If it's a benchmark index like ^NSEI or ^BSESN
    if raw.startswith("^"):
        return raw

    # Separate base ticker from suffix if present
    base = raw
    suffix = ".NS"
    if raw.endswith(".NS"):
        base = raw[:-3]
        suffix = ".NS"
    elif raw.endswith(".BO"):
        base = raw[:-3]
        suffix = ".BO"
    elif "." in raw:
        parts = raw.rsplit(".", 1)
        base = parts[0]
        suffix = f".{parts[1]}"

    # Strip clean alphanumeric
    clean_base = _clean_string_for_lookup(base)

    # Check common aliases table
    if clean_base in COMMON_TICKER_MAP:
        mapped = COMMON_TICKER_MAP[clean_base]
        if suffix == ".BO" and mapped.endswith(".NS"):
            return mapped[:-3] + ".BO"
        return mapped

    # Also strip common noise words like LIMITED, LTD, INDIA, CORP
    trimmed_base = re.sub(r"(LIMITED|LTD|CORP|CORPORATION|INDIA|SERVICES|HOLDINGS)$", "", clean_base)
    if trimmed_base and trimmed_base in COMMON_TICKER_MAP:
        mapped = COMMON_TICKER_MAP[trimmed_base]
        if suffix == ".BO" and mapped.endswith(".NS"):
            return mapped[:-3] + ".BO"
        return mapped

    return f"{clean_base}{suffix}"


def search_tickers(query: str, limit: int = 8) -> List[Dict[str, str]]:
    """
    Searches for stocks matching the query.
    Returns list of dicts: [{"symbol": "ADANIPOWER.NS", "name": "Adani Power Limited", "exchange": "NSE", "type": "Equity"}]
    Uses in-memory cache for high speed.
    """
    if not query or not query.strip():
        return []

    q_clean = query.strip()
    q_key = q_clean.lower()
    now = time.time()

    # Check search cache (1 hour TTL)
    if q_key in _SEARCH_CACHE:
        c_time, c_res = _SEARCH_CACHE[q_key]
        if now - c_time < 3600:
            return c_res

    results: List[Dict[str, str]] = []
    seen_symbols: Set[str] = set()

    # 1. First check against known aliases / popular stocks for instant local matches
    clean_q = _clean_string_for_lookup(q_clean)
    for alias_key, target_sym in COMMON_TICKER_MAP.items():
        if clean_q in alias_key or alias_key in clean_q:
            if target_sym not in seen_symbols:
                seen_symbols.add(target_sym)
                display_name = target_sym.replace(".NS", "").replace(".BO", "")
                exch = "NSE" if target_sym.endswith(".NS") else "BSE"
                results.append({
                    "symbol": target_sym,
                    "name": f"{display_name} ({alias_key.title()})",
                    "exchange": exch,
                    "type": "Equity",
                })
                if len(results) >= limit:
                    break

    # 2. Query Yahoo Finance search API
    try:
        encoded = urllib.parse.quote(q_clean)
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={encoded}&quotesCount={limit * 2}&newsCount=0"
        resp = requests.get(url, headers=SESSION_HEADERS, timeout=3.0)
        if resp.status_code == 200:
            data = resp.json()
            quotes = data.get("quotes", [])
            for item in quotes:
                sym = item.get("symbol", "")
                if not sym or sym in seen_symbols:
                    continue
                exch = item.get("exchDisp") or item.get("exchange") or ""
                name = item.get("longname") or item.get("shortname") or sym
                qtype = item.get("quoteType") or item.get("typeDisp") or "Equity"

                # Filter out non-equity options/futures unless specifically relevant
                if qtype.upper() in ["OPTION", "FUTURE"]:
                    continue

                seen_symbols.add(sym)
                results.append({
                    "symbol": sym,
                    "name": name,
                    "exchange": exch,
                    "type": qtype.title(),
                })
    except Exception as e:
        logger.warning(f"Error querying Yahoo search API for '{query}': {e}")

    # Prioritize Indian exchanges (NSE, BSE, .NS, .BO) at the top
    def _rank_ticker(item: Dict[str, str]) -> int:
        sym = item.get("symbol", "")
        exch = item.get("exchange", "").upper()
        if sym.endswith(".NS") or exch in ["NSE", "NSI"]:
            return 0
        if sym.endswith(".BO") or exch in ["BSE", "BOMBAY"]:
            return 1
        return 2

    results.sort(key=_rank_ticker)
    final_results = results[:limit]

    _SEARCH_CACHE[q_key] = (now, final_results)
    return final_results


def resolve_ticker_symbol(query: str) -> Optional[str]:
    """
    Attempts to resolve an arbitrary query (company name, alias, ticker)
    to a valid Yahoo Finance ticker symbol (.NS preferred for Indian stocks).
    """
    if not query or not query.strip():
        return None

    norm = normalize_ticker(query)
    # Check if normalized ticker already works or exists
    if norm.endswith(".NS") or norm.endswith(".BO") or norm.startswith("^"):
        return norm

    # Fallback to search resolution
    search_res = search_tickers(query, limit=5)
    if search_res:
        return search_res[0]["symbol"]

    return norm


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
    # Clear from negative cache if present
    _NEGATIVE_CACHE.pop(ticker, None)


def _fetch_from_chart_api(norm_ticker: str, range_str: str = "1y") -> Tuple[Optional[pd.Series], Optional[float], Optional[str]]:
    """Direct fast query to Yahoo Finance chart API with low-latency timeout."""
    try:
        encoded = urllib.parse.quote(norm_ticker)
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?range={range_str}&interval=1d"
        response = requests.get(url, headers=SESSION_HEADERS, timeout=4)
        
        if response.status_code == 404:
            return None, None, f"Ticker '{norm_ticker}' not found on exchange."
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

    except requests.exceptions.Timeout:
        return None, None, f"Network timeout while fetching data for '{norm_ticker}'."
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
    now = time.time()
    
    # Check negative cache to prevent repeated hangs
    if norm_ticker in _NEGATIVE_CACHE:
        c_time, c_err = _NEGATIVE_CACHE[norm_ticker]
        if now - c_time < NEGATIVE_CACHE_TTL_SECONDS:
            return None, None, c_err

    # Check cache
    cached = get_cached_ticker_data(norm_ticker)
    if cached:
        return cached[0], cached[1], None

    # Primary: Fast Direct Chart API
    series, latest_price, err = _fetch_from_chart_api(norm_ticker, range_str=period)
    
    # Fallback to yfinance with quick timeout if chart API had a non-404 error
    if (err and "not found" not in err.lower()) or (series is None and latest_price is None):
        try:
            yf_ticker = yf.Ticker(norm_ticker)
            hist = yf_ticker.history(period=period, auto_adjust=True, timeout=2.5)
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
        err_msg = err or f"Failed to fetch market quotes for '{ticker}'."
        _NEGATIVE_CACHE[norm_ticker] = (now, err_msg)
        return None, None, err_msg

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
    Returns latest prices mapped by both raw ticker and normalized ticker for reliable lookup.
    """
    raw_series_dict: Dict[str, pd.Series] = {}
    latest_prices: Dict[str, float] = {}
    errors: List[str] = []
    
    unique_tickers = list(dict.fromkeys(tickers))
    
    for ticker in unique_tickers:
        norm_t = normalize_ticker(ticker)
        series, latest_p, err = fetch_single_ticker_data(norm_t, period=period)
        if err:
            errors.append(err)
        elif series is not None and latest_p is not None:
            raw_series_dict[norm_t] = series
            latest_prices[norm_t] = latest_p
            # Also store with raw ticker key so dictionary lookups never miss
            latest_prices[ticker] = latest_p
    
    benchmark_series: Optional[pd.Series] = None
    if include_benchmark:
        b_norm = normalize_ticker(benchmark_ticker)
        b_series, _, b_err = fetch_single_ticker_data(b_norm, period=period)
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
    _NEGATIVE_CACHE.clear()
    _SEARCH_CACHE.clear()

