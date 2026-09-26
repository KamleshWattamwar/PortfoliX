"""
PortfoliX Risk Engine
Pure calculation functions for portfolio quantitative risk analysis.
Rule: MUST contain ONLY pure functions — no database, network, or FastAPI dependencies.
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd

TRADING_DAYS_PER_YEAR = 252
DEFAULT_RISK_FREE_RATE = 0.07  # 7% Indian 10-year G-Sec yield assumption
CONCENTRATION_THRESHOLD = 0.30  # 30% max recommended single-holding weight


def compute_daily_returns(prices: Union[pd.Series, pd.DataFrame]) -> Union[pd.Series, pd.DataFrame]:
    """Computes daily percentage returns from price series or DataFrame."""
    if isinstance(prices, pd.DataFrame):
        return prices.pct_change().dropna(how="all")
    return prices.pct_change().dropna()


def compute_annualized_volatility(daily_returns: pd.Series) -> float:
    """Computes annualized volatility from daily returns series."""
    clean_returns = daily_returns.dropna()
    if len(clean_returns) < 2:
        return 0.0
    vol = float(clean_returns.std(ddof=1) * np.sqrt(TRADING_DAYS_PER_YEAR))
    return max(0.0, vol)


def compute_beta(stock_returns: pd.Series, benchmark_returns: pd.Series) -> float:
    """
    Computes Beta of a stock's returns relative to benchmark returns (e.g. NIFTY 50).
    Beta = Cov(stock, benchmark) / Var(benchmark)
    """
    combined = pd.concat([stock_returns, benchmark_returns], axis=1).dropna()
    if len(combined) < 2:
        return 1.0
    
    s_ret = combined.iloc[:, 0]
    b_ret = combined.iloc[:, 1]
    
    # Check if stock and benchmark are identical series
    if s_ret.equals(b_ret) or np.allclose(s_ret.values, b_ret.values):
        return 1.0
    
    var_benchmark = float(b_ret.var(ddof=1))
    if var_benchmark == 0.0 or np.isnan(var_benchmark):
        return 1.0
    
    cov = float(s_ret.cov(b_ret))
    beta = cov / var_benchmark
    return float(beta)


def compute_sharpe_ratio(
    daily_returns: pd.Series,
    risk_free_rate: float = DEFAULT_RISK_FREE_RATE,
    volatility: Optional[float] = None,
) -> float:
    """
    Computes annualized Sharpe Ratio.
    Sharpe = (Annualized Return - Risk Free Rate) / Annualized Volatility
    """
    clean_returns = daily_returns.dropna()
    if len(clean_returns) < 2:
        return 0.0
    
    if volatility is None:
        volatility = compute_annualized_volatility(clean_returns)
    
    if volatility <= 1e-8:
        return 0.0
    
    annualized_return = float(clean_returns.mean() * TRADING_DAYS_PER_YEAR)
    sharpe = (annualized_return - risk_free_rate) / volatility
    return float(sharpe)


def compute_drawdown_series_from_prices(prices: pd.Series) -> pd.Series:
    """Computes drawdown series from a raw price series."""
    clean_prices = prices.dropna()
    if len(clean_prices) == 0:
        return pd.Series(dtype=float)
    running_max = clean_prices.cummax()
    drawdown = (clean_prices - running_max) / running_max
    return drawdown


def compute_drawdown_series(daily_returns: pd.Series) -> pd.Series:
    """
    Computes drawdown series from daily returns.
    Cumulative Returns = cumprod(1 + returns)
    Drawdown = (CumReturns - RunningMax) / RunningMax
    """
    clean_returns = daily_returns.dropna()
    if len(clean_returns) == 0:
        return pd.Series(dtype=float)
    
    cum_returns = (1.0 + clean_returns).cumprod()
    running_max = cum_returns.cummax()
    drawdown = (cum_returns - running_max) / running_max
    return drawdown


def compute_max_drawdown(daily_returns: pd.Series) -> float:
    """
    Computes maximum drawdown from daily returns.
    Returns negative fraction (e.g. -0.25 for -25% max fall).
    """
    dd_series = compute_drawdown_series(daily_returns)
    if dd_series.empty:
        return 0.0
    return float(dd_series.min())


def compute_max_drawdown_from_prices(prices: pd.Series) -> float:
    """Computes maximum drawdown directly from price series."""
    dd_series = compute_drawdown_series_from_prices(prices)
    if dd_series.empty:
        return 0.0
    return float(dd_series.min())


def compute_correlation_matrix(returns_df: pd.DataFrame) -> Dict[str, Dict[str, float]]:
    """
    Computes pairwise correlation matrix from DataFrame of returns.
    Handles single-column DataFrame gracefully (1.0).
    """
    if returns_df.empty:
        return {}
    
    if returns_df.shape[1] == 1:
        col = returns_df.columns[0]
        return {col: {col: 1.0}}
    
    corr_df = returns_df.corr().fillna(0.0)
    result = {}
    for col1 in corr_df.columns:
        result[col1] = {}
        for col2 in corr_df.columns:
            val = float(corr_df.loc[col1, col2])
            if col1 == col2:
                val = 1.0
            result[col1][col2] = round(val, 4)
    return result


def compute_portfolio_weights(holding_values: Dict[str, float]) -> Dict[str, float]:
    """
    Computes value-weighted allocation for each holding.
    Weights sum to 1.0.
    """
    total_val = sum(holding_values.values())
    if total_val <= 0:
        count = len(holding_values)
        if count == 0:
            return {}
        return {ticker: 1.0 / count for ticker in holding_values}
    
    return {ticker: val / total_val for ticker, val in holding_values.items()}


def compute_portfolio_returns(returns_df: pd.DataFrame, weights: Dict[str, float]) -> pd.Series:
    """
    Computes weighted daily portfolio returns.
    Returns aligned pandas Series.
    """
    if returns_df.empty or not weights:
        return pd.Series(dtype=float)
    
    # Align weights to DataFrame columns
    valid_cols = [col for col in returns_df.columns if col in weights]
    if not valid_cols:
        return pd.Series(dtype=float)
    
    weight_vals = [weights[col] for col in valid_cols]
    total_w = sum(weight_vals)
    if total_w > 0:
        weight_vals = [w / total_w for w in weight_vals]
    
    weights_series = pd.Series(weight_vals, index=valid_cols)
    portfolio_daily = returns_df[valid_cols].dot(weights_series)
    return portfolio_daily.dropna()


def check_concentration_warnings(
    weights: Dict[str, float], threshold: float = CONCENTRATION_THRESHOLD
) -> List[Dict[str, Union[str, float]]]:
    """
    Flags any ticker whose portfolio weight exceeds threshold (default 30%).
    """
    warnings = []
    for ticker, weight in weights.items():
        if weight > threshold:
            warnings.append({
                "ticker": ticker,
                "weight": round(weight, 4),
                "threshold": threshold,
                "message": f"{ticker} constitutes {weight * 100:.1f}% of total portfolio value (exceeds {threshold * 100:.0f}% concentration limit)."
            })
    return warnings
