from flask import Blueprint, request, jsonify

from repository.db import get_db
from services import simulator_service

simulator_bp = Blueprint("simulator", __name__)


@simulator_bp.route("/api/simulator", methods=["POST"])
def simulator():
    data = request.get_json()
    simulated_margin = data.get("margin_percentage")
    simulated_tax = data.get("tax_percentage")

    conn = get_db()
    cursor = conn.cursor()

    result = simulator_service.simulate(cursor, simulated_margin, simulated_tax)

    cursor.close()
    conn.close()

    return jsonify(result), 200