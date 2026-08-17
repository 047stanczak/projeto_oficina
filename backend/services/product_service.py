from repository import product_repository, history_repository
from services import pricing_service


def list_products_with_suggested_price(cursor):
    products = product_repository.list_products(cursor)
    global_min_stock = product_repository.find_global_min_stock(cursor)

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
            "stock": p.stock,
            "min_stock": p.min_stock,
            "effective_min_stock": p.min_stock if p.min_stock is not None else global_min_stock,
            "is_low_stock": p.stock < (p.min_stock if p.min_stock is not None else global_min_stock),
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


def update_min_stock(cursor, product_id, min_stock):
    product = product_repository.find_by_id(cursor, product_id)
    if not product:
        return False

    product_repository.update_min_stock(cursor, product_id, min_stock)
    return True


def get_global_min_stock(cursor):
    return product_repository.find_global_min_stock(cursor)


def update_global_min_stock(cursor, min_stock):
    product_repository.save_global_min_stock(cursor, min_stock)
