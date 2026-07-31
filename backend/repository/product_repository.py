from models.product import Product


def list_products(cursor):
    cursor.execute("SELECT id, code, name, current_cost, sale_price, stock FROM products")
    rows = cursor.fetchall()
    return [
        Product(
            id=r[0],
            code=r[1],
            name=r[2],
            current_cost=float(r[3]) if r[3] else 0,
            sale_price=float(r[4]) if r[4] else 0,
            stock=r[5]
        )
        for r in rows
    ]


def find_by_id(cursor, product_id):
    cursor.execute(
        "SELECT id, code, name, current_cost, sale_price, stock FROM products WHERE id = %s",
        (product_id,)
    )
    r = cursor.fetchone()
    if not r:
        return None
    return Product(
        id=r[0],
        code=r[1],
        name=r[2],
        current_cost=float(r[3]) if r[3] else 0,
        sale_price=float(r[4]) if r[4] else 0,
        stock=r[5]
    )


def find_sale_price(cursor, product_id):
    cursor.execute("SELECT sale_price FROM products WHERE id = %s", (product_id,))
    return cursor.fetchone()


def update_sale_price(cursor, product_id, new_price):
    cursor.execute(
        "UPDATE products SET sale_price = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
        (new_price, product_id)
    )


def find_by_code(cursor, code):
    cursor.execute("SELECT id, current_cost FROM products WHERE code = %s", (code,))
    return cursor.fetchone()


def create_product(cursor, code, name, new_cost, quantity):
    cursor.execute("""
        INSERT INTO products (code, name, current_cost, stock)
        VALUES (%s, %s, %s, %s)
    """, (code, name, new_cost, quantity))


def update_cost_and_stock(cursor, product_id, new_cost, quantity):
    cursor.execute("""
        UPDATE products SET current_cost = %s, stock = stock + %s, updated_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (new_cost, quantity, product_id))