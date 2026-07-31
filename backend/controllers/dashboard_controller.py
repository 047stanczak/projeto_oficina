from flask import Blueprint, jsonify

from repository.db import get_db
from services import pricing_service

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
def dashboard():
    conn = get_db()
    cursor = conn.cursor()

    indicators = pricing_service.calculate_indicators(cursor)

    cursor.close()
    conn.close()

    return jsonify(indicators), 200