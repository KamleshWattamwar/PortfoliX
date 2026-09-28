"""
Integration tests for PortfoliX API endpoints using FastAPI TestClient.
Tests Auth, CRUD, empty state 404s, CSV import validation, and risk endpoints.
"""

import io
from fastapi.testclient import TestClient
import pytest
from backend.main import app
from backend.database import Base, engine

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_and_teardown_db():
    """Ensure clean database before each test."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


@pytest.fixture
def auth_headers():
    """Helper fixture to create a test user and return Authorization headers."""
    # Register test user
    client.post(
        "/auth/register",
        json={"email": "test@portfolix.io", "password": "password123"},
    )
    # Login test user
    login_res = client.post(
        "/auth/login",
        data={"username": "test@portfolix.io", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"


def test_auth_flow():
    # 1. Register
    reg_res = client.post(
        "/auth/register",
        json={"email": "trader@portfolix.io", "password": "secretpassword"},
    )
    assert reg_res.status_code == 200
    assert reg_res.json()["email"] == "trader@portfolix.io"

    # 2. Duplicate registration fails
    dup_res = client.post(
        "/auth/register",
        json={"email": "trader@portfolix.io", "password": "secretpassword"},
    )
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post(
        "/auth/login",
        data={"username": "trader@portfolix.io", "password": "secretpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token

    # 4. /auth/me with token
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "trader@portfolix.io"


def test_empty_portfolio_returns_404(auth_headers):
    """Empty portfolio should return 404 for analytics endpoints."""
    res_summary = client.get("/portfolio/summary", headers=auth_headers)
    assert res_summary.status_code == 404
    assert "No holdings found" in res_summary.json()["detail"]

    res_risk = client.get("/portfolio/risk", headers=auth_headers)
    assert res_risk.status_code == 404

    res_corr = client.get("/portfolio/correlation", headers=auth_headers)
    assert res_corr.status_code == 404

    res_dd = client.get("/portfolio/drawdown", headers=auth_headers)
    assert res_dd.status_code == 404


def test_holdings_crud(auth_headers):
    # Create holding
    payload = {
        "ticker": "RELIANCE",
        "quantity": 10,
        "buy_price": 2500.0,
        "buy_date": "2024-01-15",
    }
    res = client.post("/holdings", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["ticker"] == "RELIANCE.NS"
    assert data["quantity"] == 10.0
    assert data["buy_price"] == 2500.0
    holding_id = data["id"]

    # List holdings
    list_res = client.get("/holdings", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1

    # Delete holding
    del_res = client.delete(f"/holdings/{holding_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify deleted
    list_res2 = client.get("/holdings", headers=auth_headers)
    assert len(list_res2.json()) == 0


def test_csv_import_valid_and_invalid(auth_headers):
    # 1. Deliberately malformed CSV (missing required column)
    bad_csv = "StockName,Shares,Rate\nTCS,10,3500\n"
    res_bad = client.post(
        "/holdings/import-csv",
        files={"file": ("holdings.csv", io.BytesIO(bad_csv.encode("utf-8")), "text/csv")},
        headers=auth_headers,
    )
    assert res_bad.status_code == 400
    assert "missing required column" in res_bad.json()["detail"]

    # 2. Valid CSV with required headers 'Symbol, Quantity, Average Price'
    good_csv = "Symbol,Quantity,Average Price,Buy Date\nINFY,15,1450.50,2024-02-01\nTCS,20,3800.00,2024-02-05\n"
    res_good = client.post(
        "/holdings/import-csv",
        files={"file": ("holdings.csv", io.BytesIO(good_csv.encode("utf-8")), "text/csv")},
        headers=auth_headers,
    )
    assert res_good.status_code == 200
    assert res_good.json()["imported"] == 2

    # Verify holdings now in DB
    list_res = client.get("/holdings", headers=auth_headers)
    assert len(list_res.json()) == 2


def test_demo_portfolio_and_summary_endpoint(auth_headers):
    # Load demo portfolio
    res_demo = client.post("/holdings/demo", headers=auth_headers)
    assert res_demo.status_code == 200
    assert len(res_demo.json()) == 5

    # Test summary endpoint
    res_summary = client.get("/portfolio/summary", headers=auth_headers)
    assert res_summary.status_code == 200
    data = res_summary.json()
    assert data["holdings_count"] == 5
    assert data["total_invested"] > 0
    assert len(data["holdings"]) == 5


def test_delete_by_ticker_and_consolidation(auth_headers):
    # 1. Add multiple lots of RELIANCE
    client.post("/holdings", json={"ticker": "RELIANCE", "quantity": 10, "buy_price": 2500.0}, headers=auth_headers)
    client.post("/holdings", json={"ticker": "RELIANCE", "quantity": 15, "buy_price": 2600.0}, headers=auth_headers)
    client.post("/holdings", json={"ticker": "TCS", "quantity": 5, "buy_price": 3800.0}, headers=auth_headers)

    # Verify 3 individual lots in database
    list_res = client.get("/holdings", headers=auth_headers)
    assert len(list_res.json()) == 3

    # Verify summary consolidates into 2 items with lot_count
    sum_res = client.get("/portfolio/summary", headers=auth_headers)
    assert sum_res.status_code == 200
    sum_data = sum_res.json()
    assert sum_data["holdings_count"] == 2
    
    reliance_summary = next(h for h in sum_data["holdings"] if "RELIANCE" in h["ticker"])
    assert reliance_summary["lot_count"] == 2
    assert reliance_summary["quantity"] == 25.0
    # Blended buy price = (10*2500 + 15*2600) / 25 = 64000 / 25 = 2560.0
    assert reliance_summary["buy_price"] == 2560.0

    # 2. Delete all lots for RELIANCE by ticker
    del_res = client.delete("/holdings/by-ticker/RELIANCE", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["deleted_count"] == 2
    assert "RELIANCE" in del_res.json()["detail"]

    # Verify only TCS remains
    remaining_res = client.get("/holdings", headers=auth_headers)
    assert len(remaining_res.json()) == 1
    assert remaining_res.json()[0]["ticker"] == "TCS.NS"

    # 3. 404 for non-existent ticker
    err_res = client.delete("/holdings/by-ticker/NONEXISTENT", headers=auth_headers)
    assert err_res.status_code == 404


def test_search_ticker_and_name_resolution(auth_headers):
    # Test ticker search endpoint
    search_res = client.get("/holdings/search-ticker?q=ADANI%20POWER", headers=auth_headers)
    assert search_res.status_code == 200
    results = search_res.json()
    assert len(results) > 0
    assert any(r["symbol"] == "ADANIPOWER.NS" for r in results)

    # Test adding holding with spaced name "ADANI POWER"
    add_res = client.post(
        "/holdings",
        json={"ticker": "ADANI POWER", "quantity": 10, "buy_price": 500.0},
        headers=auth_headers,
    )
    assert add_res.status_code == 201
    assert add_res.json()["ticker"] == "ADANIPOWER.NS"

    # Test summary resolves price correctly
    sum_res = client.get("/portfolio/summary", headers=auth_headers)
    assert sum_res.status_code == 200
    holding_item = sum_res.json()["holdings"][0]
    assert holding_item["ticker"] == "ADANIPOWER.NS"
    assert holding_item["quantity"] == 10.0
    assert holding_item["buy_price"] == 500.0
