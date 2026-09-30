import logging
import os
from datetime import timedelta

from flask import Flask, jsonify
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

import config
import validators
from auth import init_auth
from extensions import limiter
from controllers.auth_controller import auth_bp
from controllers.user_controller import user_bp
from controllers.product_controller import product_bp
from controllers.invoice_controller import invoice_bp
from controllers.rule_controller import rule_bp
from controllers.dashboard_controller import dashboard_bp
from controllers.simulator_controller import simulator_bp
from controllers.report_controller import report_bp

app = Flask(__name__)
app.config.update(
    MAX_CONTENT_LENGTH=2 * 1024 * 1024,  # NF-e XMLs are ~20 KB
    SECRET_KEY=config.SECRET_KEY,
    SESSION_COOKIE_NAME="oficina_session",
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Strict",
    SESSION_COOKIE_SECURE=config.COOKIE_SECURE,
    PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
)

app.logger.setLevel(logging.INFO)  # login / user-management audit lines

# Behind nginx: trust exactly one proxy hop for the client IP (rate limit) and scheme.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

limiter.init_app(app)  # registered first, so requests are counted before authentication runs
init_auth(app)

app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(product_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(rule_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(simulator_bp)
app.register_blueprint(report_bp)


@app.errorhandler(validators.ValidationError)
def handle_validation_error(e):
    return jsonify({"error": str(e)}), 400


@app.errorhandler(HTTPException)
def handle_http_error(e):
    return jsonify({"error": e.name}), e.code


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    app.logger.exception("Unhandled error")
    return jsonify({"error": "Internal server error"}), 500


@app.route("/", methods=["GET"])
def index():
    return "Backend running!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=os.getenv("FLASK_DEBUG") == "1", port=5000)
