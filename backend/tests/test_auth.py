import json
from datetime import datetime

import pytest

from conftest import ADMIN_PASSWORD, MEMBER_PASSWORD

ROUTES = [
    ("get", "/api/products"), ("get", "/api/pricing-rules"), ("get", "/api/dashboard"),
    ("get", "/api/stock-settings"), ("get", "/api/reports/purchase-history"),
    ("post", "/api/simulator"), ("post", "/api/upload"), ("post", "/api/update-costs"),
    ("post", "/api/products/1/market-price"), ("get", "/api/users"), ("get", "/api/me"),
    ("get", "/api/nao-existe"),
]


def login(c, username="admin", password=ADMIN_PASSWORD):
    return c.post("/api/login", json={"username": username, "password": password})


# ---- item 1: authentication is required everywhere (default deny)
@pytest.mark.parametrize("method,path", ROUTES)
def test_anonymous_is_rejected(anon_client, method, path):
    assert getattr(anon_client, method)(path).status_code == 401


def test_index_is_public(anon_client):
    assert anon_client.get("/").status_code == 200


def test_forged_cookie_is_rejected(anon_client):
    anon_client.set_cookie("oficina_session", "eyJ1c2VyX2lkIjoxfQ.forged.signature")
    assert anon_client.get("/api/products").status_code == 401


# ---- CSRF: writes need the custom header
def test_write_without_csrf_header_is_403(app_):
    c = app_.test_client()  # no X-Requested-With
    assert c.post("/api/login", json={"username": "admin", "password": ADMIN_PASSWORD}).status_code == 403


# ---- login
def test_login_ok_and_cookie_flags(anon_client):
    r = login(anon_client)
    assert r.status_code == 200 and r.get_json()["user"]["role"] == "admin"
    assert "password" not in r.get_data(as_text=True)
    cookie = r.headers["Set-Cookie"]
    assert "HttpOnly" in cookie and "SameSite=Strict" in cookie and "Secure" in cookie
    assert anon_client.get("/api/me").get_json()["user"]["username"] == "admin"


def test_login_failures_are_indistinguishable(anon_client):
    wrong = login(anon_client, "admin", "wrong-password-123")
    unknown = login(anon_client, "ghost", "whatever-password-123")
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.get_json() == unknown.get_json()


def test_inactive_user_cannot_login(anon_client, users):
    users.rows[2]["active"] = False
    assert login(anon_client, "member", MEMBER_PASSWORD).status_code == 401


def test_login_is_case_insensitive_on_username(anon_client):
    assert login(anon_client, "ADMIN").status_code == 200


def test_logout_ends_session(anon_client):
    login(anon_client)
    assert anon_client.post("/api/logout").status_code == 200
    assert anon_client.get("/api/me").status_code == 401


def test_password_is_stored_hashed(users):
    assert users.rows[1]["password_hash"].startswith("scrypt:")
    assert ADMIN_PASSWORD not in users.rows[1]["password_hash"]


# ---- sessions are re-checked against the database on every request
def test_deactivated_user_loses_access_immediately(member_client, users):
    assert member_client.get("/api/products").status_code == 200
    users.rows[2]["active"] = False
    assert member_client.get("/api/products").status_code == 401


def test_role_change_applies_immediately(client, users):
    users.rows[1]["role"] = "member"
    assert client.post("/api/pricing-rules", json={"margin_percentage": 10, "tax_percentage": 5}).status_code == 403


def test_password_change_invalidates_other_sessions(make_client, users):
    a, b = make_client("member"), make_client("member")
    r = a.post("/api/me/password", json={"current_password": MEMBER_PASSWORD, "new_password": "brand-new-password-1"})
    assert r.status_code == 200
    assert a.get("/api/me").status_code == 200   # the session that changed it stays valid
    assert b.get("/api/me").status_code == 401   # any other session is dead


def test_password_change_needs_current_password(member_client):
    r = member_client.post("/api/me/password", json={"current_password": "not-the-password-1", "new_password": "brand-new-password-1"})
    assert r.status_code == 400


def test_short_new_password_rejected(member_client):
    r = member_client.post("/api/me/password", json={"current_password": MEMBER_PASSWORD, "new_password": "short"})
    assert r.status_code == 400


# ---- roles
@pytest.mark.parametrize("method,path,body", [
    ("post", "/api/pricing-rules", {"margin_percentage": 10, "tax_percentage": 5}),
    ("post", "/api/stock-settings", {"global_min_stock": 1}),
    ("get", "/api/users", None),
    ("post", "/api/users", {"username": "novo.user", "password": "long-enough-pass-1", "role": "member"}),
    ("patch", "/api/users/1", {"active": False}),
])
def test_member_cannot_use_admin_endpoints(member_client, method, path, body):
    assert getattr(member_client, method)(path, json=body).status_code == 403


def test_member_can_do_regular_work(member_client):
    assert member_client.get("/api/products").status_code == 200
    assert member_client.get("/api/pricing-rules").status_code == 200
    assert member_client.post("/api/products/1/price", json={"sale_price": 10}).status_code == 200


def test_admin_can_write_rules(client):
    assert client.post("/api/pricing-rules", json={"margin_percentage": 10, "tax_percentage": 5}).status_code in (200, 404)


# ---- user management
def test_admin_creates_lists_and_updates_users(client, users):
    r = client.post("/api/users", json={"username": "Maria.Silva", "password": "long-enough-pass-1", "role": "member"})
    assert r.status_code == 201 and r.get_json()["user"]["username"] == "maria.silva"
    assert "password" not in r.get_data(as_text=True)
    assert client.post("/api/users", json={"username": "maria.silva", "password": "long-enough-pass-1"}).status_code == 409
    listed = client.get("/api/users").get_json()["users"]
    assert all("password_hash" not in u for u in listed)
    uid = r.get_json()["user"]["id"]
    assert client.patch(f"/api/users/{uid}", json={"active": False, "role": "admin"}).status_code == 200
    assert users.rows[uid]["active"] is False and users.rows[uid]["role"] == "admin"
    assert client.patch("/api/users/999", json={"active": False}).status_code == 404


@pytest.mark.parametrize("body", [
    {"username": "ab", "password": "long-enough-pass-1"},
    {"username": "has space", "password": "long-enough-pass-1"},
    {"username": "ok.user", "password": "short"},
    {"username": "ok.user", "password": "long-enough-pass-1", "role": "root"},
    {"username": 5, "password": "long-enough-pass-1"},
])
def test_user_creation_is_validated(client, body):
    assert client.post("/api/users", json=body).status_code == 400


def test_admin_cannot_lock_themselves_out(client):
    assert client.patch("/api/users/1", json={"active": False}).status_code == 403
    assert client.patch("/api/users/1", json={"role": "member"}).status_code == 403


def test_admin_can_reset_someone_elses_password(client, make_client):
    victim = make_client("member")
    assert client.patch("/api/users/2", json={"password": "reset-by-admin-123"}).status_code == 200
    assert victim.get("/api/me").status_code == 401
    assert login(make_client(), "member", "reset-by-admin-123").status_code == 200


# ---- item 7: rate limits
def test_login_is_rate_limited_per_account(anon_client):
    codes = [login(anon_client, "admin", "wrong-password-123").status_code for _ in range(12)]
    assert codes[:10] == [401] * 10 and 429 in codes[10:]
    # the account stays throttled even with the right password
    assert login(anon_client).status_code == 429


def test_login_is_rate_limited_per_ip_across_accounts(anon_client):
    codes = [login(anon_client, f"user{i}", "wrong-password-123").status_code for i in range(12)]
    assert 429 in codes


def test_market_price_is_rate_limited(client, monkeypatch):
    from services import market_query_service
    monkeypatch.setattr(market_query_service, "query_product_price",
                        lambda cursor, pid: {"id": 1, "product_id": pid, "name": "x", "response": "r", "sources": [], "date": "d"})
    codes = [client.post("/api/products/1/market-price").status_code for _ in range(7)]
    assert codes[:5] == [200] * 5 and codes[5:] == [429, 429]


def test_rate_limit_is_per_user(client, member_client, monkeypatch):
    from services import market_query_service
    monkeypatch.setattr(market_query_service, "query_product_price",
                        lambda cursor, pid: {"id": 1, "product_id": pid, "name": "x", "response": "r", "sources": [], "date": "d"})
    for _ in range(6):
        client.post("/api/products/1/market-price")
    assert member_client.post("/api/products/1/market-price").status_code == 200


def test_recent_market_query_is_served_from_cache(monkeypatch):
    from types import SimpleNamespace
    from services import market_query_service as svc
    monkeypatch.setattr(svc.product_repository, "find_by_id", lambda c, pid: SimpleNamespace(id=pid, name="Mola"))
    monkeypatch.setattr(svc.market_query_repository, "find_recent",
                        lambda c, pid, minutes: (7, "cached answer", json.dumps([]), datetime(2026, 1, 1)))
    monkeypatch.setattr(svc.gemini_client, "query_market_price", lambda name: pytest.fail("Gemini must not be called"))
    result = svc.query_product_price(None, 1)
    assert result["cached"] is True and result["response"] == "cached answer"
