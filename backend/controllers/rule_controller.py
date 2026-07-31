from flask import Blueprint, request, jsonify

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
def save_rule():
    data = request.get_json()
    product_id = data.get("product_id")  # None = global rule
    margin = data.get("margin_percentage")
    tax = data.get("tax_percentage")

    conn = get_db()
    cursor = conn.cursor()

    rule_service.save_rule(cursor, product_id, margin, tax)

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True}), 200