import json

from repository import product_repository, market_query_repository
import gemini_client


def query_product_price(cursor, product_id):
    """Returns None if the product doesn't exist."""
    product = product_repository.find_by_id(cursor, product_id)
    if not product:
        return None

    result = gemini_client.query_market_price(product.name)

    row = market_query_repository.register_query(
        cursor, product.id, result["response"], json.dumps(result["sources"])
    )

    return {
        "id": row[0],
        "product_id": product.id,
        "name": product.name,
        "response": result["response"],
        "sources": result["sources"],
        "date": row[1].isoformat()
    }


def list_history(cursor, product_id):
    rows = market_query_repository.list_by_product(cursor, product_id)
    return [
        {
            "id": r[0],
            "response": r[1],
            "sources": json.loads(r[2]) if r[2] else [],
            "date": r[3].isoformat() if r[3] else None
        }
        for r in rows
    ]