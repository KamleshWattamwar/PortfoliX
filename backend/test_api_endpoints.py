"""
Integration tests for PortfoliX API endpoints using FastAPI TestClient.
Tests CRUD, empty state 404s, CSV import validation, and risk endpoints.
"""

import io
from fastapi.testclient import TestClient
import pytest
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.models import Holding

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Ensure clean database before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"


def test_empty_portfolio_returns_404():
    """Empty portfolio should return 404 for analytics endpoints as required in spec."""
    res_summary = client.get("/portfolio/summary")
    assert res_summary.status_code == 404
    assert "No holdings found" in res_summary.json()["detail"]

    res_risk = client.get("/portfolio/risk")
    assert res_risk.status_code == 404

    res_corr = client.get("/portfolio/correlation")
    assert res_corr.status_code == 404

    res_dd = client.get("/portfolio/drawdown")
    assert res_dd.status_code == 404


def test_holdings_crud():
    # Create holding
    payload = {
        "ticker": "RELIANCE",
        "quantity": 10,
        "buy_price": 2500.0,
        "buy_date": "2024-01-15",
    }
    res = client.post("/holdings", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["ticker"] == "RELIANCE.NS"
    assert data["quantity"] == 10.0
    assert data["buy_price"] == 2500.0
    holding_id = data["id"]

    # List holdings
    list_res = client.get("/holdings")
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Delete holding
    del_res = client.delete(f"/holdings/{holding_id}")
    assert del_res.status_code == 200

    # Verify deleted
    list_res2 = client.get("/holdings")
    assert len(list_res2.json()) == 0


def test_csv_import_valid_and_invalid():
    # 1. Deliberately malformed CSV (missing required column)
    bad_csv = "StockName,Shares,Rate\nTCS,10,3500\n"
    res_bad = client.post(
        "/holdings/import-csv",
        files={"file": ("holdings.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")},
    )
    assert res_bad.status_code == 400
    assert "missing required column" in res_bad.json()["detail"]

    # 2. Valid CSV with required headers 'Symbol, Quantity, Average Price'
    good_csv = "Symbol,Quantity,Average Price,Buy Date\nINFY,15,1450.50,2024-02-01\nTCS,20,3800.00,2024-02-05\n"
    res_good = client.post(
        "/holdings/import-csv",
        files={"file": ("holdings.csv", io.BytesIO(good_csv.encode("utf-8")), "text/csv")},
    )
    assert res_good.status_code == 200
    assert res_good.json()["imported"] == 2

    # Verify holdings now in DB
    list_res = client.get("/holdings")
    assert len(list_res.json()) == 2


def test_demo_portfolio_and_summary_endpoint():
    # Load demo portfolio
    res_demo = client.post("/holdings/demo")
    assert res_demo.status_code == 200
    assert len(res_demo.json()) == 5

    # Test summary endpoint
    res_summary = client.get("/portfolio/summary")
    assert res_summary.status_code == 200
    data = res_summary.json()
    assert data["holdings_count"] == 5
    assert data["total_invested"] > 0
    assert len(data["holdings"]) == 5


def test_delete_by_ticker_and_consolidation():
    # 1. Add multiple lots of RELIANCE
    client.post("/holdings", json={"ticker": "RELIANCE", "quantity": 10, "buy_price": 2500.0})
    client.post("/holdings", json={"ticker": "RELIANCE", "quantity": 15, "buy_price": 2600.0})
    client.post("/holdings", json={"ticker": "TCS", "quantity": 5, "buy_price": 3800.0})

    # Verify 3 individual lots in database
    list_res = client.get("/holdings")
    assert len(list_res.json()) == 3

    # Verify summary consolidates into 2 items with lot_count
    sum_res = client.get("/portfolio/summary")
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["holdings_count"] == 2
    
    reliance_summary = next(h for h in sum_data["holdings"] if "RELIANCE" in h["ticker"])
    assert reliance_summary["lot_count"] == 2
    assert reliance_summary["quantity"] == 25.0
    # Blended buy price = (10*2500 + 15*2600) / 25 = (25000 + 39000) / 25 = 64000 / 25 = 2560.0
    assert reliance_summary["buy_price"] == 2560.0

    # 2. Delete all lots for RELIANCE by ticker
    del_res = client.delete("/holdings/by-ticker/RELIANCE")
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 2
    assert "RELIANCE" in del_res.json()["detail"]

    # Verify only TCS remains
    remaining_res = client.get("/holdings")
    assert len(remaining_res.json()) == 1
    assert remaining_res.json()[0]["ticker"] == "TCS.NS"

    # 3. 404 for non-existent ticker
    err_res = client.delete("/holdings/by-ticker/NONEXISTENT")
    assert err_res.status_code == 404

