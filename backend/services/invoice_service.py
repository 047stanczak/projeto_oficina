from datetime import datetime

from xml_parser import extract_invoice_products
from repository import invoice_repository, product_repository, history_repository


def process_upload(file_path):
    return extract_invoice_products(file_path)


def register_invoice(cursor, file_name):
    return invoice_repository.create_invoice(cursor, "1", "1", datetime.now().date(), "Supplier", file_name)


def invoice_exists(cursor, invoice_id):
    return invoice_repository.exists(cursor, invoice_id)


def update_costs(cursor, invoice_id, updates):
    for upd in updates:
        code = upd.get("code")
        new_cost = upd.get("new_cost")
        quantity = upd.get("quantity", 0)

        result = product_repository.find_by_code(cursor, code)

        if result:
            product_id, old_cost = result
            history_repository.register_purchase_history(
                cursor, product_id, old_cost, new_cost, quantity, invoice_id, datetime.now()
            )
            product_repository.update_cost_and_stock(cursor, product_id, new_cost, quantity)
        else:
            product_repository.create_product(cursor, code, upd.get("name", "Product"), new_cost, quantity)