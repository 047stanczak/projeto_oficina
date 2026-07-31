from flask import Blueprint, jsonify

from repository.db import get_db
from services import report_service

report_bp = Blueprint("report", __name__)


@report_bp.route("/api/reports/purchase-history", methods=["GET"])
def purchase_history():
    conn = get_db()
    cursor = conn.cursor()

    history = report_service.purchase_history(cursor)

    cursor.close()
    conn.close()

    return jsonify({"history": history}), 200


@report_bp.route("/api/reports/price-history", methods=["GET"])
def price_history():
    conn = get_db()
    cursor = conn.cursor()

    history = report_service.price_history(cursor)

    cursor.close()
    conn.close()

    return jsonify({"history": history}), 200


@report_bp.route("/api/reports/highest-cost-increase", methods=["GET"])
def highest_cost_increase():
    conn = get_db()
    cursor = conn.cursor()

    products = report_service.highest_cost_increase(cursor)

    cursor.close()
    conn.close()

    return jsonify({"products": products}), 200