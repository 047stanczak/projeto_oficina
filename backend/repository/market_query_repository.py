def register_query(cursor, product_id, response, sources_json):
    cursor.execute("""
        INSERT INTO market_queries (product_id, response, sources)
        VALUES (%s, %s, %s) RETURNING id, created_at
    """, (product_id, response, sources_json))
    return cursor.fetchone()


def list_by_product(cursor, product_id):
    cursor.execute("""
        SELECT id, response, sources, created_at
        FROM market_queries
        WHERE product_id = %s
        ORDER BY created_at DESC
    """, (product_id,))
    return cursor.fetchall()