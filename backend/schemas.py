"""
Pydantic schemas for request validation and structured API responses.
"""

from datetime import date, datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field

# --- Auth Schemas ---

class UserCreate(BaseModel):
    email: str = Field(..., min_length=5, description="User email")
    password: str = Field(..., min_length=6, max_length=72, description="Password (6-72 chars)")


class UserOut(BaseModel):
    id: int
    email: str
    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --- Holding Schemas ---

class HoldingBase(BaseModel):
    ticker: str = Field(..., description="Stock symbol (e.g. RELIANCE, TCS.NS)")
    quantity: float = Field(..., gt=0, description="Number of shares held")
    buy_price: float = Field(..., gt=0, description="Average purchase price")
    buy_date: Optional[date] = Field(None, description="Purchase date (YYYY-MM-DD)")


class HoldingCreate(HoldingBase):
    pass


class HoldingResponse(HoldingBase):
    id: int
    created_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


class CsvImportResponse(BaseModel):
    imported: int
    message: str
    errors: List[str] = []


class TickerSearchResult(BaseModel):
    symbol: str
    name: str
    exchange: str
    type: str = "Equity"


# --- Portfolio Summary Schemas ---

class HoldingSummaryItem(BaseModel):
    ticker: str
    quantity: float
    buy_price: float
    current_price: float
    invested_value: float
    current_value: float
    pnl: float
    pnl_percent: float
    weight: float
    lot_count: int = 1
    id: Optional[int] = None


class PortfolioSummaryResponse(BaseModel):
    total_invested: float
    total_current_value: float
    total_pnl: float
    total_pnl_percent: float
    holdings_count: int
    holdings: List[HoldingSummaryItem]
    errors: List[str] = []


# --- Portfolio Risk Schemas ---

class StockRiskMetrics(BaseModel):
    ticker: str
    volatility: float  # Annualized
    beta: float        # vs ^NSEI
    sharpe_ratio: float # Annualized
    max_drawdown: float # e.g. -0.23
    current_price: float
    weight: float


class ConcentrationWarning(BaseModel):
    ticker: str
    weight: float
    threshold: float
    message: str


class PortfolioRiskResponse(BaseModel):
    portfolio_volatility: float
    portfolio_beta: float
    portfolio_sharpe_ratio: float
    portfolio_max_drawdown: float
    benchmark: str = "^NSEI"
    weights: Dict[str, float]
    per_stock: List[StockRiskMetrics]
    concentration_warnings: List[ConcentrationWarning]
    errors: List[str] = []


# --- Correlation Matrix Schema ---

class CorrelationResponse(BaseModel):
    tickers: List[str]
    matrix: Dict[str, Dict[str, float]]
    errors: List[str] = []


# --- Drawdown Series Schema ---

class DrawdownDataPoint(BaseModel):
    date: str
    drawdown: float
    portfolio_value_scaled: Optional[float] = None


class DrawdownResponse(BaseModel):
    dates: List[str]
    drawdown: List[float]
    series: List[DrawdownDataPoint]
    max_drawdown: float
    errors: List[str] = []
