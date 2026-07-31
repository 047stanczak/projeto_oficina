from repository import product_repository, rule_repository
from models.pricing_rule import PricingRule


def find_rule(cursor, product_id):
    """Returns the product's rule, or the global rule if there's no specific one."""
    row = rule_repository.find_specific_rule(cursor, product_id)

    if not row:
        row = rule_repository.find_global_rule(cursor)

    if not row:
        return None

    return PricingRule(margin_percentage=float(row[0]), tax_percentage=float(row[1]))


def calculate_suggested_price(cost, margin_percentage, tax_percentage):
    if cost is None:
        return None

    divisor = 1 - (tax_percentage / 100)
    if divisor <= 0:
        return None

    return round(float(cost) * (1 + margin_percentage / 100) / divisor, 2)


def calculate_indicators(cursor):
    products = product_repository.list_products(cursor)

    invested_value = 0.0
    potential_sale_value = 0.0
    net_profit = 0.0
    products_for_adjustment = 0

    for product in products:
        invested_value += product.current_cost * product.stock
        potential_sale_value += product.sale_price * product.stock

        rule = find_rule(cursor, product.id)
        if rule:
            tax = rule.tax_percentage
            net_profit += (product.sale_price - product.current_cost - (product.sale_price * tax / 100)) * product.stock

            suggested_price = calculate_suggested_price(product.current_cost, rule.margin_percentage, tax)
            if suggested_price and abs(suggested_price - product.sale_price) / max(suggested_price, 1) > 0.1:
                products_for_adjustment += 1

    gross_profit = potential_sale_value - invested_value
    profitability = (net_profit / invested_value * 100) if invested_value > 0 else 0

    return {
        "invested_value": round(invested_value, 2),
        "potential_sale_value": round(potential_sale_value, 2),
        "gross_profit_estimate": round(gross_profit, 2),
        "net_profit_estimate": round(net_profit, 2),
        "estimated_profitability_percentage": round(profitability, 2),
        "products_for_adjustment": products_for_adjustment
    }