from repository import history_repository


def purchase_history(cursor):
    rows = history_repository.list_purchase_history(cursor)
    return [
        {
            "id": r[0], "code": r[1], "name": r[2],
            "old_cost": float(r[3]) if r[3] else 0,
            "new_cost": float(r[4]) if r[4] else 0,
            "quantity": r[5],
            "date": r[6].isoformat() if r[6] else None
        }
        for r in rows
    ]


def price_history(cursor):
    rows = history_repository.list_price_history(cursor)
    return [
        {
            "id": r[0], "code": r[1], "name": r[2],
            "old_price": float(r[3]) if r[3] else 0,
            "new_price": float(r[4]) if r[4] else 0,
            "date": r[5].isoformat() if r[5] else None
        }
        for r in rows
    ]


def highest_cost_increase(cursor):
    rows = history_repository.list_highest_cost_increase(cursor)
    return [
        {
            "code": r[0], "name": r[1],
            "old_cost": float(r[2]) if r[2] else 0,
            "new_cost": float(r[3]) if r[3] else 0,
            "increase": float(r[4]) if r[4] else 0
        }
        for r in rows
    ]