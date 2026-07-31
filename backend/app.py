from flask import Flask
from flask_cors import CORS

from controllers.product_controller import product_bp
from controllers.invoice_controller import invoice_bp
from controllers.rule_controller import rule_bp
from controllers.dashboard_controller import dashboard_bp
from controllers.simulator_controller import simulator_bp
from controllers.report_controller import report_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(product_bp)
app.register_blueprint(invoice_bp)
app.register_blueprint(rule_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(simulator_bp)
app.register_blueprint(report_bp)


@app.route("/", methods=["GET"])
def index():
    return "Backend running!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, port=5000)