_COLUMNS = "id, username, password_hash, role, active, created_at"


def _to_dict(row):
    if row is None:
        return None
    return {
        "id": row[0],
        "username": row[1],
        "password_hash": row[2],
        "role": row[3],
        "active": row[4],
        "created_at": row[5],
    }


def find_by_id(cursor, user_id):
    cursor.execute(f"SELECT {_COLUMNS} FROM users WHERE id = %s", (user_id,))
    return _to_dict(cursor.fetchone())


def find_by_username(cursor, username):
    cursor.execute(f"SELECT {_COLUMNS} FROM users WHERE username = %s", (username,))
    return _to_dict(cursor.fetchone())


def list_all(cursor):
    cursor.execute(f"SELECT {_COLUMNS} FROM users ORDER BY username")
    return [_to_dict(r) for r in cursor.fetchall()]


def create(cursor, username, password_hash, role):
    cursor.execute(
        f"INSERT INTO users (username, password_hash, role) VALUES (%s, %s, %s) RETURNING {_COLUMNS}",
        (username, password_hash, role),
    )
    return _to_dict(cursor.fetchone())


def update(cursor, user_id, role=None, active=None, password_hash=None):
    cursor.execute(
        """
        UPDATE users
        SET role = COALESCE(%s, role),
            active = COALESCE(%s, active),
            password_hash = COALESCE(%s, password_hash)
        WHERE id = %s
        RETURNING """ + _COLUMNS,
        (role, active, password_hash, user_id),
    )
    return _to_dict(cursor.fetchone())
