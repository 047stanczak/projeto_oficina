def find_specific_rule(cursor, product_id):
    cursor.execute("""
        SELECT margin_percentage, tax_percentage
        FROM pricing_rules WHERE product_id = %s
    """, (product_id,))
    return cursor.fetchone()


def find_global_rule(cursor):
    cursor.execute("""
        SELECT margin_percentage, tax_percentage
        FROM pricing_rules WHERE product_id IS NULL
    """)
    return cursor.fetchone()


def list_rules(cursor):
    cursor.execute("""
        SELECT r.id, r.product_id, p.name, r.margin_percentage, r.tax_percentage
        FROM pricing_rules r
        LEFT JOIN products p ON p.id = r.product_id
        ORDER BY r.product_id NULLS FIRST
    """)
    return cursor.fetchall()


def save_product_rule(cursor, product_id, margin, tax):
    cursor.execute("""
        INSERT INTO pricing_rules (product_id, margin_percentage, tax_percentage)
        VALUES (%s, %s, %s)
        ON CONFLICT (product_id) DO UPDATE
        SET margin_percentage = %s, tax_percentage = %s, updated_at = CURRENT_TIMESTAMP
    """, (product_id, margin, tax, margin, tax))


def save_global_rule(cursor, margin, tax):
    cursor.execute("""
        INSERT INTO pricing_rules (product_id, margin_percentage, tax_percentage)
        VALUES (NULL, %s, %s)
        ON CONFLICT ((product_id IS NULL)) WHERE product_id IS NULL DO UPDATE
        SET margin_percentage = %s, tax_percentage = %s, updated_at = CURRENT_TIMESTAMP
    """, (margin, tax, margin, tax))