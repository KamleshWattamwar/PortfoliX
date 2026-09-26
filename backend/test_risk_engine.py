"""
Unit tests for PortfoliX Risk Engine.
Validates financial formulas with hand-calculable expected values and edge cases.
"""

import math
import numpy as np
import pandas as pd
import pytest

from backend.services.risk_engine import (
    TRADING_DAYS_PER_YEAR,
    DEFAULT_RISK_FREE_RATE,
    compute_daily_returns,
    compute_annualized_volatility,
    compute_beta,
    compute_sharpe_ratio,
    compute_max_drawdown,
    compute_drawdown_series,
    compute_drawdown_series_from_prices,
    compute_max_drawdown_from_prices,
    compute_correlation_matrix,
    compute_portfolio_weights,
    compute_portfolio_returns,
    check_concentration_warnings,
)


def test_beta_asset_against_itself():
    """Sanity Check 1: Beta of an asset against itself must equal exactly 1.0."""
    returns = pd.Series([0.01, -0.02, 0.015, -0.005, 0.03, -0.01], index=pd.date_range("2024-01-01", periods=6))
    beta = compute_beta(returns, returns)
    assert math.isclose(beta, 1.0, rel_tol=1e-5), f"Expected 1.0, got {beta}"


def test_max_drawdown_on_synthetic_prices():
    """
    Sanity Check 2: Max drawdown on prices [100, 150, 75, 120] should equal exactly -0.5 (-50%).
    From peak 150 dropping to 75 -> (75 - 150) / 150 = -0.5.
    """
    prices = pd.Series([100.0, 150.0, 75.0, 120.0], index=pd.date_range("2024-01-01", periods=4))
    
    # Test from prices directly
    mdd_price = compute_max_drawdown_from_prices(prices)
    assert math.isclose(mdd_price, -0.5, rel_tol=1e-5), f"Expected -0.5, got {mdd_price}"
    
    # Test via daily returns
    returns = compute_daily_returns(prices)
    mdd_ret = compute_max_drawdown(returns)
    assert math.isclose(mdd_ret, -0.5, rel_tol=1e-5), f"Expected -0.5, got {mdd_ret}"


def test_portfolio_weights_sum_to_one():
    """Sanity Check 3: Portfolio weights must always sum to 1.0."""
    holding_values = {
        "RELIANCE.NS": 50000.0,
        "TCS.NS": 30000.0,
        "INFY.NS": 20000.0,
    }
    weights = compute_portfolio_weights(holding_values)
    total_weight = sum(weights.values())
    assert math.isclose(total_weight, 1.0, rel_tol=1e-5), f"Expected 1.0, got {total_weight}"
    assert math.isclose(weights["RELIANCE.NS"], 0.5, rel_tol=1e-5)
    assert math.isclose(weights["TCS.NS"], 0.3, rel_tol=1e-5)
    assert math.isclose(weights["INFY.NS"], 0.2, rel_tol=1e-5)


def test_volatility_is_non_negative():
    """Sanity Check 4: Volatility must always be non-negative."""
    returns = pd.Series([0.01, -0.01, 0.02, -0.015, 0.005], index=pd.date_range("2024-01-01", periods=5))
    vol = compute_annualized_volatility(returns)
    assert vol >= 0.0
    
    # Zero variance series
    flat_returns = pd.Series([0.01, 0.01, 0.01, 0.01], index=pd.date_range("2024-01-01", periods=4))
    flat_vol = compute_annualized_volatility(flat_returns)
    assert math.isclose(flat_vol, 0.0, abs_tol=1e-5)


def test_sharpe_ratio_formula():
    """Sharpe ratio: (annualized return - risk_free_rate) / volatility."""
    daily_mean = 0.001  # Annualized = 0.001 * 252 = 0.252 (25.2%)
    volatility = 0.20   # 20%
    rf = 0.07           # 7%
    # Expected Sharpe = (0.252 - 0.07) / 0.20 = 0.182 / 0.20 = 0.91
    
    # Create synthetic series with mean 0.001
    np.random.seed(42)
    series = pd.Series(np.full(100, daily_mean), index=pd.date_range("2024-01-01", periods=100))
    sharpe = compute_sharpe_ratio(series, risk_free_rate=rf, volatility=volatility)
    assert math.isclose(sharpe, 0.91, rel_tol=1e-4)


def test_correlation_matrix_properties():
    """Correlation matrix values must be between -1 and 1, diagonal must be 1.0."""
    dates = pd.date_range("2024-01-01", periods=10)
    df = pd.DataFrame({
        "A": [0.01, 0.02, -0.01, 0.03, -0.02, 0.015, -0.01, 0.025, -0.005, 0.01],
        "B": [-0.01, -0.015, 0.02, -0.025, 0.015, -0.01, 0.012, -0.02, 0.01, -0.008],
        "C": [0.005, 0.01, -0.005, 0.015, -0.01, 0.008, -0.005, 0.012, -0.002, 0.005],
    }, index=dates)
    
    corr = compute_correlation_matrix(df)
    for k1 in ["A", "B", "C"]:
        assert corr[k1][k1] == 1.0
        for k2 in ["A", "B", "C"]:
            val = corr[k1][k2]
            assert -1.0 <= val <= 1.0
            assert corr[k1][k2] == corr[k2][k1]


def test_single_holding_edge_case():
    """Single holding case should compute 1x1 correlation matrix and valid portfolio returns."""
    dates = pd.date_range("2024-01-01", periods=5)
    df = pd.DataFrame({"RELIANCE.NS": [0.01, -0.01, 0.02, -0.005, 0.015]}, index=dates)
    corr = compute_correlation_matrix(df)
    assert corr == {"RELIANCE.NS": {"RELIANCE.NS": 1.0}}
    
    weights = {"RELIANCE.NS": 1.0}
    p_ret = compute_portfolio_returns(df, weights)
    assert len(p_ret) == 5
    assert np.allclose(p_ret.values, df["RELIANCE.NS"].values)


def test_concentration_warnings():
    """Concentration alert triggers when weight > 30%."""
    # Balanced portfolio
    balanced_weights = {"A": 0.25, "B": 0.25, "C": 0.25, "D": 0.25}
    assert len(check_concentration_warnings(balanced_weights)) == 0
    
    # Overconcentrated portfolio
    concentrated_weights = {"A": 0.50, "B": 0.30, "C": 0.20}
    warnings = check_concentration_warnings(concentrated_weights)
    assert len(warnings) == 1
    assert warnings[0]["ticker"] == "A"
    assert warnings[0]["weight"] == 0.5
