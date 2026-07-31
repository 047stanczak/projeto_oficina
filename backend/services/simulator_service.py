from repository import product_repository
from services import pricing_service


def simulate(cursor, simulated_margin, simulated_tax):
    """Simulates indicators with hypothetical margin/tax, without changing real data."""
    products = product_repository.list_products(cursor)

    invested_value = 0.0
    potential_sale_value = 0.0
    net_profit = 0.0

    for product in products:
        current_cost = product.current_cost
        stock = product.stock

        suggested_price = pricing_service.calculate_suggested_price(current_cost, simulated_margin, simulated_tax) or 0

        invested_value += current_cost * stock
        potential_sale_value += suggested_price * stock
        net_profit += (suggested_price - current_cost - (suggested_price * simulated_tax / 100)) * stock

    gross_profit = potential_sale_value - invested_value
    profitability = (net_profit / invested_value * 100) if invested_value > 0 else 0

    return {
        "invested_value": round(invested_value, 2),
        "potential_sale_value": round(potential_sale_value, 2),
        "gross_profit_estimate": round(gross_profit, 2),
        "net_profit_estimate": round(net_profit, 2),
        "estimated_profitability_percentage": round(profitability, 2)
    }