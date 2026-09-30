from flask import Blueprint, current_app, g, jsonify

import validators
from auth import admin_required
from repository.db import get_db
from services import user_service

user_bp = Blueprint("user", __name__)


@user_bp.route("/api/users", methods=["GET"])
@admin_required
def list_users():
    conn = get_db()
    cursor = conn.cursor()
    users = user_service.list_users(cursor)
    cursor.close()
    conn.close()
    return jsonify({"users": users}), 200


@user_bp.route("/api/users", methods=["POST"])
@admin_required
def create_user():
    data = validators.json_body()
    username = validators.username(data.get("username"))
    password = validators.password(data.get("password"))
    role = validators.role(data.get("role", "member"))

    conn = get_db()
    cursor = conn.cursor()
    user = user_service.create_user(cursor, username, password, role)
    if user is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "Username already exists"}), 409

    conn.commit()
    cursor.close()
    conn.close()

    current_app.logger.info("user created username=%s role=%s by=%s", username, role, g.user["username"])
    return jsonify({"user": user_service.public(user)}), 201


@user_bp.route("/api/users/<int:user_id>", methods=["PATCH"])
@admin_required
def update_user(user_id):
    data = validators.json_body()
    role = validators.role(data["role"]) if "role" in data else None
    active = validators.boolean(data["active"], "active") if "active" in data else None
    password = validators.password(data["password"]) if "password" in data else None

    if role is None and active is None and password is None:
        return jsonify({"error": "Nothing to update"}), 400

    # An admin can't lock themselves out; their own password goes through /api/me/password.
    if user_id == g.user["id"]:
        return jsonify({"error": "Use your own account page to change your password; role and status can't be changed by yourself"}), 403

    conn = get_db()
    cursor = conn.cursor()
    user = user_service.update_user(cursor, user_id, role, active, password)
    if user is None:
        cursor.close()
        conn.close()
        return jsonify({"error": "User not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    current_app.logger.info(
        "user updated id=%s role=%s active=%s password_reset=%s by=%s",
        user_id, role, active, password is not None, g.user["username"],
    )
    return jsonify({"user": user_service.public(user)}), 200
