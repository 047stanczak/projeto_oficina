import io
import os

import pytest

from xml_parser import extract_invoice_products

NS = "http://www.portalfiscal.inf.br/nfe"


def nfe(name="Item", code="1", cost="1.5", qty="2", doctype=""):
    return (
        f'<?xml version="1.0"?>{doctype}<NFe xmlns="{NS}"><det><prod>'
        f"<cProd>{code}</cProd><xProd>{name}</xProd><vUnCom>{cost}</vUnCom><qCom>{qty}</qCom>"
        "</prod></det></NFe>"
    ).encode()


def upload(client, filename, content):
    return client.post("/api/upload", data={"file": (io.BytesIO(content), filename)},
                       content_type="multipart/form-data")


# ---- item 3: path traversal
def test_upload_traversal_filename_is_neutralised(client, db, tmp_path):
    r = upload(client, "../../evil.xml", nfe())
    assert r.status_code == 200
    recorded = [p for _, p in db.cur.calls if p and "evil.xml" in str(p)]
    assert recorded and "/" not in str(recorded[0]) and ".." not in str(recorded[0])
    assert not os.path.exists(tmp_path.parent / "evil.xml")
    assert os.listdir(tmp_path) == []  # file removed after processing (item 8)


def test_upload_rejects_non_xml(client):
    assert upload(client, "a.txt", b"x").status_code == 400


# ---- item 4: XXE
def test_xxe_is_not_resolved(tmp_path):
    secret = tmp_path / "secret.txt"
    secret.write_text("SECRETDATA")
    doctype = f'<!DOCTYPE r [<!ENTITY x SYSTEM "file://{secret}">]>'
    f = tmp_path / "x.xml"
    f.write_bytes(nfe(name="&x;", doctype=doctype))
    try:
        result = extract_invoice_products(str(f))
    except ValueError:
        return
    assert "SECRETDATA" not in str(result)


def test_valid_nfe_still_parses(tmp_path):
    f = tmp_path / "ok.xml"
    f.write_bytes(nfe())
    assert extract_invoice_products(str(f))[0]["code"] == "1"


# ---- item 5: no internal details leaked
def test_unexpected_error_is_generic(client, monkeypatch):
    from services import product_service

    def boom(cursor):
        raise RuntimeError("secret-detail")

    monkeypatch.setattr(product_service, "list_products_with_suggested_price", boom)
    r = client.get("/api/products")
    assert r.status_code == 500 and "secret-detail" not in r.get_data(as_text=True)


# ---- item 6: input validation
@pytest.mark.parametrize("path,body", [
    ("/api/products/1/price", '{"sale_price": -1}'),
    ("/api/products/1/price", '{"sale_price": NaN}'),
    ("/api/products/1/price", '{"sale_price": true}'),
    ("/api/products/1/price", '{"sale_price": "10"}'),
    ("/api/products/1/price", '{"sale_price": 1e12}'),
    ("/api/products/1/price", "not json"),
    ("/api/products/1/min-stock", '{"min_stock": -3}'),
    ("/api/stock-settings", '{"global_min_stock": true}'),
    ("/api/pricing-rules", '{"margin_percentage": 10, "tax_percentage": 100}'),
    ("/api/pricing-rules", '{"margin_percentage": -1, "tax_percentage": 5}'),
    ("/api/simulator", '{"margin_percentage": 10, "tax_percentage": 150}'),
    ("/api/update-costs", '{"invoice_id": 1, "updates": [{"code": "A", "new_cost": 1, "quantity": -5}]}'),
    ("/api/update-costs", '{"invoice_id": "1", "updates": []}'),
    ("/api/update-costs", '{"invoice_id": 1, "updates": [{"code": "%s", "new_cost": 1}]}' % ("A" * 21)),
])
def test_invalid_input_is_rejected(client, path, body):
    r = client.post(path, data=body, content_type="application/json")
    assert r.status_code == 400


def test_valid_input_accepted(client):
    r = client.post("/api/products/1/price", json={"sale_price": 10.5})
    assert r.status_code == 200


# ---- item 8: size limit
def test_upload_too_large(client):
    assert upload(client, "big.xml", b"<a>" + b"x" * (2 * 1024 * 1024 + 10)).status_code == 413


# ---- rule for a product that does not exist must be 404, not 500
def test_rule_for_unknown_product_is_404(client, monkeypatch):
    from services import rule_service
    monkeypatch.setattr(rule_service.product_repository, "find_by_id", lambda cursor, pid: None)
    r = client.post("/api/pricing-rules", json={"product_id": 99, "margin_percentage": 10, "tax_percentage": 5})
    assert r.status_code == 404
