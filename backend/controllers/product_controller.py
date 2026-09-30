from flask import Blueprint, jsonify, current_app

import validators
from auth import admin_required
from extensions import limiter
from repository.db import get_db
from services import product_service, market_query_service

product_bp = Blueprint("product", __name__)


@product_bp.route("/api/products", methods=["GET"])
def list_products():
    conn = get_db()
    cursor = conn.cursor()

    result = product_service.list_products_with_suggested_price(cursor)

    cursor.close()
    conn.close()

    return jsonify({"products": result}), 200


@product_bp.route("/api/products/<int:product_id>/price", methods=["POST"])
def update_sale_price(product_id):
    data = validators.json_body()
    new_price = validators.number(data.get("sale_price"), "sale_price")

    conn = get_db()
    cursor = conn.cursor()

    updated = product_service.update_sale_price(cursor, product_id, new_price)

    if not updated:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True}), 200


@product_bp.route("/api/products/<int:product_id>/min-stock", methods=["POST"])
def update_min_stock(product_id):
    data = validators.json_body()
    min_stock = validators.integer(data.get("min_stock"), "min_stock", nullable=True)

    conn = get_db()
    cursor = conn.cursor()
    updated = product_service.update_min_stock(cursor, product_id, min_stock)

    if not updated:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True}), 200


@product_bp.route("/api/stock-settings", methods=["GET"])
def get_stock_settings():
    conn = get_db()
    cursor = conn.cursor()
    min_stock = product_service.get_global_min_stock(cursor)
    cursor.close()
    conn.close()
    return jsonify({"global_min_stock": min_stock}), 200


@product_bp.route("/api/stock-settings", methods=["POST"])
@admin_required
def update_stock_settings():
    data = validators.json_body()
    min_stock = validators.integer(data.get("global_min_stock"), "global_min_stock")

    conn = get_db()
    cursor = conn.cursor()
    product_service.update_global_min_stock(cursor, min_stock)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True}), 200


@product_bp.route("/api/products/<int:product_id>/market-price", methods=["POST"])
@limiter.limit("5 per minute;60 per hour")  # per user
@limiter.limit("200 per day", key_func=lambda: "gemini-global", override_defaults=False)  # cost cap for the whole app
def query_market_price(product_id):
    conn = get_db()
    cursor = conn.cursor()

    try:
        result = market_query_service.query_product_price(cursor, product_id)
    except Exception:
        current_app.logger.exception("Market price query failed")
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": "Market price query failed"}), 502

    if not result:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify(result), 200


@product_bp.route("/api/products/<int:product_id>/market-price", methods=["GET"])
def market_price_history(product_id):
    conn = get_db()
    cursor = conn.cursor()

    history = market_query_service.list_history(cursor, product_id)

    cursor.close()
    conn.close()

    return jsonify({"history": history}), 200
