from repository import rule_repository


def list_rules(cursor):
    rows = rule_repository.list_rules(cursor)
    return [
        {
            "id": r[0],
            "product_id": r[1],
            "product_name": r[2] if r[1] else "Default rule (global)",
            "margin_percentage": float(r[3]),
            "tax_percentage": float(r[4])
        }
        for r in rows
    ]


def save_rule(cursor, product_id, margin, tax):
    if product_id:
        rule_repository.save_product_rule(cursor, product_id, margin, tax)
    else:
        rule_repository.save_global_rule(cursor, margin, tax)