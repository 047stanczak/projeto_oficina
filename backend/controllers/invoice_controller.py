import os

from flask import Blueprint, request, jsonify

from repository.db import get_db
from services import invoice_service

invoice_bp = Blueprint("invoice", __name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@invoice_bp.route("/api/upload", methods=["POST"])
def upload_invoice():
    if "file" not in request.files:
        return jsonify({"error": "File not sent"}), 400

    file = request.files["file"]

    if not file.filename.endswith(".xml"):
        return jsonify({"error": "File must be XML"}), 400

    path = os.path.join(UPLOAD_DIR, file.filename)
    file.save(path)

    try:
        products = invoice_service.process_upload(path)

        conn = get_db()
        cursor = conn.cursor()

        invoice_id = invoice_service.register_invoice(cursor, file.filename)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "invoice_id": invoice_id,
            "products": products
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@invoice_bp.route("/api/update-costs", methods=["POST"])
def update_costs():
    data = request.get_json()
    invoice_id = data.get("invoice_id")
    updates = data.get("updates", [])

    conn = get_db()
    cursor = conn.cursor()

    invoice_service.update_costs(cursor, invoice_id, updates)

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True}), 200