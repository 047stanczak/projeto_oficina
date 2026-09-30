import os
import uuid

from flask import Blueprint, request, jsonify
from lxml import etree
from werkzeug.utils import secure_filename

import validators
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

    filename = secure_filename(file.filename)

    if not filename.lower().endswith(".xml"):
        return jsonify({"error": "File must be XML"}), 400

    # Stored under a random name; the client-supplied name is only kept as a label in the DB.
    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4().hex}.xml")
    file.save(path)

    try:
        products = invoice_service.process_upload(path)

        conn = get_db()
        cursor = conn.cursor()

        invoice_id = invoice_service.register_invoice(cursor, filename)

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({
            "success": True,
            "invoice_id": invoice_id,
            "products": products
        }), 200

    except (etree.LxmlError, ValueError):
        return jsonify({"error": "Invalid invoice file"}), 400

    finally:
        os.remove(path)


@invoice_bp.route("/api/update-costs", methods=["POST"])
def update_costs():
    data = validators.json_body()
    invoice_id = validators.integer(data.get("invoice_id"), "invoice_id", minimum=1)
    updates = validators.update_items(data.get("updates"))

    conn = get_db()
    cursor = conn.cursor()

    if not invoice_service.invoice_exists(cursor, invoice_id):
        cursor.close()
        conn.close()
        return jsonify({"error": "Invoice not found"}), 404

    invoice_service.update_costs(cursor, invoice_id, updates)

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"success": True}), 200