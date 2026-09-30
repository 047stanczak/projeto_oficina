from flask import Blueprint, jsonify

import validators
from auth import admin_required
from repository.db import get_db
from services import rule_service

rule_bp = Blueprint("rule", __name__)


@rule_bp.route("/api/pricing-rules", methods=["GET"])
def list_rules():
    conn = get_db()
    cursor = conn.cursor()

    rules = rule_service.list_rules(cursor)

    cursor.close()
    conn.close()

    return jsonify({"rules": rules}), 200


@rule_bp.route("/api/pricing-rules", methods=["POST"])
@admin_required
def save_rule():
    data = validators.json_body()
    product_id = validators.integer(data.get("product_id"), "product_id", minimum=1, nullable=True)  # None = global rule
    margin = validators.margin(data.get("margin_percentage"))
    tax = validators.tax(data.get("tax_percentage"))

    conn = get_db()
    cursor = conn.cursor()

    if not rule_service.save_rule(cursor, product_id, margin, tax):
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True}), 200