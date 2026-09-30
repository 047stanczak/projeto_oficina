from flask import Blueprint, current_app, g, jsonify, request, session
from flask_limiter.util import get_remote_address

import validators
from auth import start_session
from extensions import limiter
from repository.db import get_db
from services import user_service

auth_bp = Blueprint("auth", __name__)


def _login_username_key():
    data = request.get_json(silent=True)
    name = data.get("username") if isinstance(data, dict) else None
    if isinstance(name, str) and name.strip():
        return f"login:{name.strip().lower()[:50]}"
    return f"login-ip:{get_remote_address()}"


@auth_bp.route("/api/login", methods=["POST"])
@limiter.limit("10 per minute;100 per hour")  # per IP
@limiter.limit("10 per 15 minutes", key_func=_login_username_key)  # per account, across IPs
def login():
    data = validators.json_body()
    username = data.get("username")
    password = data.get("password")

    if (
        not isinstance(username, str)
        or not isinstance(password, str)
        or len(username) > 50
        or len(password) > validators.PASSWORD_MAX
    ):
        return jsonify({"error": "Invalid username or password"}), 401

    conn = get_db()
    cursor = conn.cursor()
    user = user_service.authenticate(cursor, username.strip().lower(), password)
    cursor.close()
    conn.close()

    if user is None:
        current_app.logger.warning("login failed username=%r ip=%s", username[:50], get_remote_address())
        return jsonify({"error": "Invalid username or password"}), 401

    start_session(user)
    current_app.logger.info("login ok username=%s ip=%s", user["username"], get_remote_address())
    return jsonify({"user": user_service.public(user)}), 200


@auth_bp.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True}), 200


@auth_bp.route("/api/me", methods=["GET"])
def me():
    return jsonify({"user": user_service.public(g.user)}), 200


@auth_bp.route("/api/me/password", methods=["POST"])
@limiter.limit("10 per hour")
def change_password():
    data = validators.json_body()
    current = validators.password(data.get("current_password"), "current_password")
    new = validators.password(data.get("new_password"), "new_password")

    conn = get_db()
    cursor = conn.cursor()
    updated = user_service.change_own_password(cursor, g.user, current, new)
    if updated is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Current password is incorrect"}), 400

    conn.commit()
    cursor.close()
    conn.close()

    start_session(updated)  # re-issues this session; every other session of the user becomes invalid
    current_app.logger.info("password changed username=%s", updated["username"])
    return jsonify({"success": True}), 200
