"""
Portfolio Risk & Analytics router for PortfoliX.
Exposes endpoints for Summary, Risk metrics, Correlation matrix, and Drawdown timeline.
"""

from typing import Dict, List
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Holding
from backend.schemas import (
    ConcentrationWarning,
    CorrelationResponse,
    DrawdownDataPoint,
    DrawdownResponse,
    HoldingSummaryItem,
    PortfolioRiskResponse,
    PortfolioSummaryResponse,
    StockRiskMetrics,
)
from backend.services.market_data import (
    DEFAULT_BENCHMARK,
    fetch_portfolio_market_data,
    fetch_single_ticker_data,
)
from backend.services.risk_engine import (
    check_concentration_warnings,
    compute_annualized_volatility,
    compute_beta,
    compute_correlation_matrix,
    compute_daily_returns,
    compute_drawdown_series,
    compute_max_drawdown,
    compute_portfolio_returns,
    compute_portfolio_weights,
    compute_sharpe_ratio,
)

router = APIRouter(prefix="/portfolio", tags=["Risk & Analytics"])


def get_db_holdings_or_404(db: Session) -> List[Holding]:
    """Helper to verify holdings exist before running analytics."""
    holdings = db.query(Holding).all()
    if not holdings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No holdings found. Add some first.",
        )
    return holdings


@router.get("/summary", response_model=PortfolioSummaryResponse)
def get_portfolio_summary(db: Session = Depends(get_db)):
    """
    Computes portfolio summary:
    Total invested value, current market value, overall P&L, P&L %, and consolidated per-ticker breakdown.
    """
    holdings = get_db_holdings_or_404(db)
    
    # Group holdings by normalized ticker
    ticker_groups: Dict[str, List[Holding]] = {}
    for h in holdings:
        t_key = h.ticker.strip().upper()
        ticker_groups.setdefault(t_key, []).append(h)
        
    tickers = list(ticker_groups.keys())
    
    # Fetch market data
    _, latest_prices, _, errors = fetch_portfolio_market_data(tickers, include_benchmark=False)
    
    items = []
    total_invested = 0.0
    total_current_val = 0.0
    
    ticker_totals = {}
    for ticker, lots in ticker_groups.items():
        qty_total = sum(h.quantity for h in lots)
        inv_total = sum(h.quantity * h.buy_price for h in lots)
        curr_price = latest_prices.get(ticker, (inv_total / qty_total) if qty_total > 0 else 0.0)
        curr_val = qty_total * curr_price
        
        total_invested += inv_total
        total_current_val += curr_val
        ticker_totals[ticker] = {
            "quantity": qty_total,
            "invested": inv_total,
            "current_price": curr_price,
            "current_value": curr_val,
            "lot_count": len(lots),
            "primary_id": lots[0].id,
        }
    
    for ticker, data in ticker_totals.items():
        inv_val = data["invested"]
        curr_val = data["current_value"]
        qty = data["quantity"]
        blended_avg_buy_price = (inv_val / qty) if qty > 0 else 0.0
        pnl = curr_val - inv_val
        pnl_pct = (pnl / inv_val * 100.0) if inv_val > 0 else 0.0
        
        item_weight = (curr_val / total_current_val) if total_current_val > 0 else (1.0 / len(ticker_totals))
        
        items.append(
            HoldingSummaryItem(
                id=data["primary_id"],
                ticker=ticker,
                quantity=round(qty, 4),
                buy_price=round(blended_avg_buy_price, 2),
                current_price=round(data["current_price"], 2),
                invested_value=round(inv_val, 2),
                current_value=round(curr_val, 2),
                pnl=round(pnl, 2),
                pnl_percent=round(pnl_pct, 2),
                weight=round(item_weight, 4),
                lot_count=data["lot_count"],
            )
        )
    
    # Sort items by current value descending
    items.sort(key=lambda x: x.current_value, reverse=True)
    
    total_pnl = total_current_val - total_invested
    total_pnl_pct = (total_pnl / total_invested * 100.0) if total_invested > 0 else 0.0
    
    return PortfolioSummaryResponse(
        total_invested=round(total_invested, 2),
        total_current_value=round(total_current_val, 2),
        total_pnl=round(total_pnl, 2),
        total_pnl_percent=round(total_pnl_pct, 2),
        holdings_count=len(items),
        holdings=items,
        errors=errors,
    )


@router.get("/risk", response_model=PortfolioRiskResponse)
def get_portfolio_risk(db: Session = Depends(get_db)):
    """
    Computes comprehensive risk metrics:
    - Portfolio-level: Volatility, Beta vs NIFTY 50, Sharpe Ratio, Max Drawdown
    - Per-holding metrics: Individual Volatility, Beta, Sharpe, Max Drawdown, Weights
    - Concentration warnings (>30% weight threshold)
    """
    holdings = get_db_holdings_or_404(db)
    tickers = [h.ticker for h in holdings]
    
    prices_df, latest_prices, benchmark_series, errors = fetch_portfolio_market_data(
        tickers, include_benchmark=True
    )
    
    # Calculate holding values for weighting
    holding_values = {}
    for h in holdings:
        curr_price = latest_prices.get(h.ticker, h.buy_price)
        holding_values[h.ticker] = holding_values.get(h.ticker, 0.0) + (h.quantity * curr_price)
    
    weights = compute_portfolio_weights(holding_values)
    
    if prices_df.empty or benchmark_series is None or len(prices_df) < 5:
        # Fallback if no market data available
        per_stock_list = [
            StockRiskMetrics(
                ticker=t,
                volatility=0.0,
                beta=1.0,
                sharpe_ratio=0.0,
                max_drawdown=0.0,
                current_price=latest_prices.get(t, 0.0),
                weight=weights.get(t, 0.0),
            )
            for t in set(tickers)
        ]
        return PortfolioRiskResponse(
            portfolio_volatility=0.0,
            portfolio_beta=1.0,
            portfolio_sharpe_ratio=0.0,
            portfolio_max_drawdown=0.0,
            benchmark=DEFAULT_BENCHMARK,
            weights=weights,
            per_stock=per_stock_list,
            concentration_warnings=[],
            errors=errors or ["Insufficient historical market data returned."],
        )
    
    # Compute returns
    returns_df = compute_daily_returns(prices_df)
    benchmark_returns = compute_daily_returns(benchmark_series)
    
    # Calculate per-stock metrics
    per_stock_list: List[StockRiskMetrics] = []
    for ticker in prices_df.columns:
        stock_ret = returns_df[ticker]
        vol = compute_annualized_volatility(stock_ret)
        beta = compute_beta(stock_ret, benchmark_returns)
        sharpe = compute_sharpe_ratio(stock_ret, volatility=vol)
        mdd = compute_max_drawdown(stock_ret)
        
        per_stock_list.append(
            StockRiskMetrics(
                ticker=ticker,
                volatility=round(vol, 4),
                beta=round(beta, 4),
                sharpe_ratio=round(sharpe, 4),
                max_drawdown=round(mdd, 4),
                current_price=round(latest_prices.get(ticker, 0.0), 2),
                weight=round(weights.get(ticker, 0.0), 4),
            )
        )
    
    # Calculate portfolio-level metrics
    portfolio_daily_returns = compute_portfolio_returns(returns_df, weights)
    
    p_vol = compute_annualized_volatility(portfolio_daily_returns)
    p_beta = compute_beta(portfolio_daily_returns, benchmark_returns)
    p_sharpe = compute_sharpe_ratio(portfolio_daily_returns, volatility=p_vol)
    p_mdd = compute_max_drawdown(portfolio_daily_returns)
    
    # Check concentration warnings
    raw_warnings = check_concentration_warnings(weights)
    concentration_warnings = [
        ConcentrationWarning(
            ticker=w["ticker"],
            weight=round(w["weight"], 4),
            threshold=round(w["threshold"], 4),
            message=w["message"],
        )
        for w in raw_warnings
    ]
    
    return PortfolioRiskResponse(
        portfolio_volatility=round(p_vol, 4),
        portfolio_beta=round(p_beta, 4),
        portfolio_sharpe_ratio=round(p_sharpe, 4),
        portfolio_max_drawdown=round(p_mdd, 4),
        benchmark=DEFAULT_BENCHMARK,
        weights={k: round(v, 4) for k, v in weights.items()},
        per_stock=per_stock_list,
        concentration_warnings=concentration_warnings,
        errors=errors,
    )


@router.get("/correlation", response_model=CorrelationResponse)
def get_portfolio_correlation(db: Session = Depends(get_db)):
    """
    Computes pairwise correlation matrix of daily returns between all portfolio holdings.
    """
    holdings = get_db_holdings_or_404(db)
    tickers = list(dict.fromkeys([h.ticker for h in holdings]))
    
    prices_df, _, _, errors = fetch_portfolio_market_data(tickers, include_benchmark=False)
    
    if prices_df.empty or len(prices_df) < 5:
        # 1x1 fallback or identity
        matrix = {t: {t2: (1.0 if t == t2 else 0.0) for t2 in tickers} for t in tickers}
        return CorrelationResponse(tickers=tickers, matrix=matrix, errors=errors)
    
    returns_df = compute_daily_returns(prices_df)
    matrix = compute_correlation_matrix(returns_df)
    
    return CorrelationResponse(
        tickers=list(prices_df.columns),
        matrix=matrix,
        errors=errors,
    )


@router.get("/drawdown", response_model=DrawdownResponse)
def get_portfolio_drawdown(db: Session = Depends(get_db)):
    """
    Computes time series of portfolio drawdown over the 1-year lookback period.
    """
    holdings = get_db_holdings_or_404(db)
    tickers = [h.ticker for h in holdings]
    
    prices_df, latest_prices, _, errors = fetch_portfolio_market_data(tickers, include_benchmark=False)
    
    if prices_df.empty or len(prices_df) < 5:
        return DrawdownResponse(dates=[], drawdown=[], series=[], max_drawdown=0.0, errors=errors)
    
    holding_values = {}
    for h in holdings:
        curr_price = latest_prices.get(h.ticker, h.buy_price)
        holding_values[h.ticker] = holding_values.get(h.ticker, 0.0) + (h.quantity * curr_price)
    
    weights = compute_portfolio_weights(holding_values)
    returns_df = compute_daily_returns(prices_df)
    portfolio_daily_returns = compute_portfolio_returns(returns_df, weights)
    
    drawdown_series = compute_drawdown_series(portfolio_daily_returns)
    max_dd = float(drawdown_series.min()) if not drawdown_series.empty else 0.0
    
    dates = []
    dd_values = []
    data_points = []
    
    for dt, val in drawdown_series.items():
        dt_str = dt.strftime("%Y-%m-%d") if hasattr(dt, "strftime") else str(dt)[:10]
        dd_val = round(float(val), 4)
        dates.append(dt_str)
        dd_values.append(dd_val)
        data_points.append(DrawdownDataPoint(date=dt_str, drawdown=dd_val))
    
    return DrawdownResponse(
        dates=dates,
        drawdown=dd_values,
        series=data_points,
        max_drawdown=round(max_dd, 4),
        errors=errors,
    )
