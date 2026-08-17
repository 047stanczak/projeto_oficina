from flask import Blueprint, request, jsonify

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
    data = request.get_json()
    new_price = data.get("sale_price")

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
    data = request.get_json()
    min_stock = data.get("min_stock")

    if min_stock is not None and (not isinstance(min_stock, int) or min_stock < 0):
        return jsonify({"error": "Minimum stock must be a non-negative integer"}), 400

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
def update_stock_settings():
    data = request.get_json()
    min_stock = data.get("global_min_stock")
    if not isinstance(min_stock, int) or min_stock < 0:
        return jsonify({"error": "Minimum stock must be a non-negative integer"}), 400

    conn = get_db()
    cursor = conn.cursor()
    product_service.update_global_min_stock(cursor, min_stock)
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"success": True}), 200


@product_bp.route("/api/products/<int:product_id>/market-price", methods=["POST"])
def query_market_price(product_id):
    conn = get_db()
    cursor = conn.cursor()

    try:
        result = market_query_service.query_product_price(cursor, product_id)
    except Exception as e:
        conn.rollback()
        cursor.close()
        conn.close()
        return jsonify({"error": str(e)}), 500

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
