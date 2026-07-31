from repository import product_repository, history_repository
from services import pricing_service


def list_products_with_suggested_price(cursor):
    products = product_repository.list_products(cursor)

    result = []
    for p in products:
        rule = pricing_service.find_rule(cursor, p.id)
        suggested_price = (
            pricing_service.calculate_suggested_price(p.current_cost, rule.margin_percentage, rule.tax_percentage)
            if rule else None
        )

        result.append({
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "current_cost": p.current_cost,
            "sale_price": p.sale_price,
            "suggested_price": suggested_price,
            "stock": p.stock
        })

    return result


def update_sale_price(cursor, product_id, new_price):
    """Returns False if the product doesn't exist, True if updated."""
    result = product_repository.find_sale_price(cursor, product_id)
    if not result:
        return False

    old_price = result[0]

    product_repository.update_sale_price(cursor, product_id, new_price)
    history_repository.register_price_history(cursor, product_id, old_price, new_price)

    return True