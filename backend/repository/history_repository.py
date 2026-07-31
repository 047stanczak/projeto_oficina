def register_price_history(cursor, product_id, old_price, new_price):
    cursor.execute("""
        INSERT INTO price_history (product_id, old_price, new_price)
        VALUES (%s, %s, %s)
    """, (product_id, old_price, new_price))


def register_purchase_history(cursor, product_id, old_cost, new_cost, quantity, invoice_id, purchase_date):
    cursor.execute("""
        INSERT INTO purchase_history (product_id, old_cost, new_cost, quantity, invoice_id, purchase_date)
        VALUES (%s, %s, %s, %s, %s, %s)
    """, (product_id, old_cost, new_cost, quantity, invoice_id, purchase_date))


def list_purchase_history(cursor):
    cursor.execute("""
        SELECT h.id, p.code, p.name, h.old_cost, h.new_cost, h.quantity, h.purchase_date
        FROM purchase_history h
        JOIN products p ON p.id = h.product_id
        ORDER BY h.purchase_date DESC
    """)
    return cursor.fetchall()


def list_price_history(cursor):
    cursor.execute("""
        SELECT h.id, p.code, p.name, h.old_price, h.new_price, h.created_at
        FROM price_history h
        JOIN products p ON p.id = h.product_id
        ORDER BY h.created_at DESC
    """)
    return cursor.fetchall()


def list_highest_cost_increase(cursor):
    cursor.execute("""
        SELECT p.code, p.name, h.old_cost, h.new_cost,
               (h.new_cost - h.old_cost) AS increase
        FROM purchase_history h
        JOIN products p ON p.id = h.product_id
        WHERE h.old_cost IS NOT NULL
        ORDER BY increase DESC
        LIMIT 20
    """)
    return cursor.fetchall()