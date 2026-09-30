import hashlib
from functools import wraps

from flask import g, jsonify, request, session

from repository import user_repository
from repository.db import get_db

PUBLIC_ENDPOINTS = {"index", "auth.login"}
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}


def password_tag(password_hash):
    """Short fingerprint of the password hash; a session carrying an old one is rejected."""
    return hashlib.sha256(password_hash.encode()).hexdigest()[:16]


def start_session(user):
    session.clear()
    session["user_id"] = user["id"]
    session["pv"] = password_tag(user["password_hash"])
    session.permanent = True


def _current_user():
    uid = session.get("user_id")
    if not isinstance(uid, int):
        return None

    conn = get_db()
    cursor = conn.cursor()
    user = user_repository.find_by_id(cursor, uid)
    cursor.close()
    conn.close()

    if not user or not user["active"] or session.get("pv") != password_tag(user["password_hash"]):
        session.clear()
        return None
    return user


def init_auth(app):
    @app.before_request
    def guard():
        # CSRF: browsers cannot add a custom header cross-site without a CORS preflight (which we never allow).
        if request.method not in SAFE_METHODS and request.headers.get("X-Requested-With") != "XMLHttpRequest":
            return jsonify({"error": "Forbidden"}), 403

        # Default deny: every endpoint (including unknown paths) requires a session, except the public ones.
        if request.endpoint in PUBLIC_ENDPOINTS:
            return None

        user = _current_user()
        if user is None:
            return jsonify({"error": "Authentication required"}), 401
        g.user = user
        return None


def admin_required(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        if g.user["role"] != "admin":
            return jsonify({"error": "Forbidden"}), 403
        return view(*args, **kwargs)

    return wrapper
