"""
Holdings router for PortfoliX.
Implements CRUD operations for portfolio positions and broker CSV import.
All endpoints require authentication and only touch the current user's data.
"""

import io
from typing import List
import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Holding, User
from backend.schemas import CsvImportResponse, HoldingCreate, HoldingResponse
from backend.services.market_data import normalize_ticker

router = APIRouter(prefix="/holdings", tags=["Holdings"])


@router.get("", response_model=List[HoldingResponse])
def get_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all holdings of the logged-in user."""
    return (
        db.query(Holding)
        .filter(Holding.user_id == current_user.id)
        .order_by(Holding.id.desc())
        .all()
    )


@router.post("", response_model=HoldingResponse, status_code=status.HTTP_201_CREATED)
def create_holding(
    holding_in: HoldingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a new stock holding to the logged-in user's portfolio."""
    ticker_clean = normalize_ticker(holding_in.ticker)

    holding = Holding(
        user_id=current_user.id,
        ticker=ticker_clean,
        quantity=float(holding_in.quantity),
        buy_price=float(holding_in.buy_price),
        buy_date=holding_in.buy_date,
    )
    db.add(holding)
    db.commit()
    db.refresh(holding)
    return holding


@router.delete("/{holding_id}")
def delete_holding(
    holding_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete one of the user's holdings by ID."""
    holding = (
        db.query(Holding)
        .filter(Holding.id == holding_id, Holding.user_id == current_user.id)
        .first()
    )
    if not holding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Holding with ID {holding_id} not found",
        )
    db.delete(holding)
    db.commit()
    return {"detail": "Deleted", "id": holding_id}


@router.delete("/by-ticker/{ticker}")
def delete_holdings_by_ticker(
    ticker: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete all of the user's lots matching that ticker (case-insensitive, e.g. RELIANCE or RELIANCE.NS).
    """
    clean_ticker = normalize_ticker(ticker)
    raw_clean = ticker.strip()

    holdings = (
        db.query(Holding)
        .filter(
            Holding.user_id == current_user.id,
            (Holding.ticker.ilike(clean_ticker)) | (Holding.ticker.ilike(raw_clean)),
        )
        .all()
    )

    if not holdings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No holdings found for ticker '{ticker}'",
        )

    deleted_count = len(holdings)
    for h in holdings:
        db.delete(h)
    db.commit()

    return {
        "detail": f"Deleted all lots for {clean_ticker}",
        "deleted_count": deleted_count,
        "ticker": clean_ticker,
    }


@router.delete("/action/clear-all")
def clear_all_holdings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete all of the user's holdings (reset their portfolio)."""
    count = db.query(Holding).filter(Holding.user_id == current_user.id).delete()
    db.commit()
    return {"detail": "All holdings deleted", "deleted_count": count}


@router.post("/import-csv", response_model=CsvImportResponse)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Import holdings from a broker export CSV file into the user's portfolio.
    Required CSV columns: 'Symbol', 'Quantity', 'Average Price'
    Optional column: 'Buy Date'
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV (.csv) file.",
        )

    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to parse CSV file: {str(e)}",
        )

    # Normalize column names (strip whitespace, case-insensitive match)
    col_map = {}
    for col in df.columns:
        c_clean = str(col).strip().lower()
        if c_clean in ["symbol", "ticker", "instrument", "stock"]:
            col_map["symbol"] = col
        elif c_clean in ["quantity", "qty", "shares"]:
            col_map["quantity"] = col
        elif c_clean in ["average price", "avg price", "avg_price", "buy price", "price", "avg. price"]:
            col_map["avg_price"] = col
        elif c_clean in ["buy date", "date", "purchase date"]:
            col_map["buy_date"] = col

    # Validate required columns
    required = ["symbol", "quantity", "avg_price"]
    missing = [req for req in required if req not in col_map]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CSV is missing required column(s): {', '.join(missing)}. Expected columns: 'Symbol', 'Quantity', 'Average Price'. Found: {list(df.columns)}",
        )

    imported_count = 0
    errors = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # 1-indexed row number considering header
        try:
            symbol_raw = str(row[col_map["symbol"]]).strip()
            if not symbol_raw or symbol_raw.lower() == "nan":
                continue

            ticker = normalize_ticker(symbol_raw)
            quantity = float(row[col_map["quantity"]])
            avg_price = float(row[col_map["avg_price"]])

            if quantity <= 0 or avg_price <= 0:
                errors.append(f"Row {row_num}: Quantity and Average Price must be > 0 (got qty={quantity}, price={avg_price}).")
                continue

            buy_date = None
            if "buy_date" in col_map and pd.notna(row[col_map["buy_date"]]):
                try:
                    buy_date = pd.to_datetime(row[col_map["buy_date"]]).date()
                except Exception:
                    buy_date = None

            holding = Holding(
                user_id=current_user.id,
                ticker=ticker,
                quantity=quantity,
                buy_price=avg_price,
                buy_date=buy_date,
            )
            db.add(holding)
            imported_count += 1

        except (ValueError, TypeError) as e:
            errors.append(f"Row {row_num}: Invalid numeric data ({str(e)}).")

    if imported_count > 0:
        db.commit()

    return CsvImportResponse(
        imported=imported_count,
        message=f"Successfully imported {imported_count} holding(s)." if imported_count > 0 else "No valid holdings imported.",
        errors=errors,
    )


@router.post("/demo", response_model=List[HoldingResponse])
def load_demo_portfolio(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Preloads a diversified sample portfolio of NIFTY 50 bluechips for the logged-in user."""
    # Clear only this user's existing holdings
    db.query(Holding).filter(Holding.user_id == current_user.id).delete()

    demo_holdings = [
        Holding(user_id=current_user.id, ticker="RELIANCE.NS", quantity=25, buy_price=1250.0),
        Holding(user_id=current_user.id, ticker="TCS.NS", quantity=20, buy_price=2200.0),
        Holding(user_id=current_user.id, ticker="HDFCBANK.NS", quantity=50, buy_price=700.0),
        Holding(user_id=current_user.id, ticker="INFY.NS", quantity=40, buy_price=1050.0),
        Holding(user_id=current_user.id, ticker="ICICIBANK.NS", quantity=60, buy_price=750.0),
    ]

    for h in demo_holdings:
        db.add(h)
    db.commit()

    return db.query(Holding).filter(Holding.user_id == current_user.id).all()