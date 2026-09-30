import os
import sys
from datetime import datetime

os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-with-at-least-32-characters")
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import psycopg2
import pytest
from werkzeug.security import generate_password_hash

ADMIN_PASSWORD = "admin-password-123"
MEMBER_PASSWORD = "member-password-123"
_HASHES = {
    "admin": generate_password_hash(ADMIN_PASSWORD),
    "member": generate_password_hash(MEMBER_PASSWORD),
}


class FakeCursor:
    def __init__(self):
        self.calls = []

    def execute(self, sql, params=None):
        self.calls.append((sql, params))

    def fetchone(self):
        return (1,)

    def fetchall(self):
        return []

    def close(self):
        pass


class FakeConn:
    def __init__(self):
        self.cur = FakeCursor()

    def cursor(self):
        return self.cur

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        pass


class FakeUsers:
    """In-memory replacement for repository.user_repository."""

    def __init__(self):
        self.rows = {}
        self.add("admin", "admin", _HASHES["admin"])
        self.add("member", "member", _HASHES["member"])

    def add(self, username, role, password_hash, active=True):
        uid = len(self.rows) + 1
        self.rows[uid] = {"id": uid, "username": username, "password_hash": password_hash,
                          "role": role, "active": active, "created_at": datetime(2026, 1, 1)}
        return self.rows[uid]

    def find_by_id(self, cursor, user_id):
        return self.rows.get(user_id)

    def find_by_username(self, cursor, username):
        return next((u for u in self.rows.values() if u["username"] == username), None)

    def list_all(self, cursor):
        return sorted(self.rows.values(), key=lambda u: u["username"])

    def create(self, cursor, username, password_hash, role):
        return self.add(username, role, password_hash)

    def update(self, cursor, user_id, role=None, active=None, password_hash=None):
        u = self.rows.get(user_id)
        if u is None:
            return None
        if role is not None:
            u["role"] = role
        if active is not None:
            u["active"] = active
        if password_hash is not None:
            u["password_hash"] = password_hash
        return u


@pytest.fixture
def db(monkeypatch):
    conn = FakeConn()
    monkeypatch.setattr(psycopg2, "connect", lambda **kw: conn)
    return conn


@pytest.fixture
def users(monkeypatch):
    from repository import user_repository
    fake = FakeUsers()
    for name in ("find_by_id", "find_by_username", "list_all", "create", "update"):
        monkeypatch.setattr(user_repository, name, getattr(fake, name))
    return fake


@pytest.fixture
def app_(db, users, tmp_path, monkeypatch):
    from controllers import invoice_controller
    from extensions import limiter
    monkeypatch.setattr(invoice_controller, "UPLOAD_DIR", str(tmp_path))
    from app import app
    app.config["TESTING"] = True
    limiter.reset()
    return app


@pytest.fixture
def make_client(app_, users):
    from auth import password_tag

    def _make(username=None):
        c = app_.test_client()
        c.environ_base["HTTP_X_REQUESTED_WITH"] = "XMLHttpRequest"
        if username:
            user = users.find_by_username(None, username)
            with c.session_transaction() as s:
                s["user_id"] = user["id"]
                s["pv"] = password_tag(user["password_hash"])
        return c

    return _make


@pytest.fixture
def client(make_client):
    """Logged in as admin."""
    return make_client("admin")


@pytest.fixture
def member_client(make_client):
    return make_client("member")


@pytest.fixture
def anon_client(make_client):
    return make_client()
