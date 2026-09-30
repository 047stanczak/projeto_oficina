def create_invoice(cursor, number, series, issue_date, supplier, file_name):
    cursor.execute("""
        INSERT INTO invoices (number, series, issue_date, supplier, file_name)
        VALUES (%s, %s, %s, %s, %s) RETURNING id
    """, (number, series, issue_date, supplier, file_name))
    return cursor.fetchone()[0]


def exists(cursor, invoice_id):
    cursor.execute("SELECT 1 FROM invoices WHERE id = %s", (invoice_id,))
    return cursor.fetchone() is not None
