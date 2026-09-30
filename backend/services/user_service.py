from werkzeug.security import check_password_hash, generate_password_hash

from repository import user_repository

# Used to spend the same time on unknown usernames as on wrong passwords.
_DUMMY_HASH = generate_password_hash("dummy-password-for-timing")


def public(user):
    return {
        "id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "active": user["active"],
        "created_at": user["created_at"].isoformat() if user["created_at"] else None,
    }


def authenticate(cursor, username, password):
    """Returns the user dict, or None for any kind of failure (unknown, inactive, wrong password)."""
    user = user_repository.find_by_username(cursor, username)
    stored = user["password_hash"] if user else _DUMMY_HASH
    valid = check_password_hash(stored, password)
    if not user or not valid or not user["active"]:
        return None
    return user


def list_users(cursor):
    return [public(u) for u in user_repository.list_all(cursor)]


def create_user(cursor, username, password, role):
    """Returns None if the username is already taken."""
    if user_repository.find_by_username(cursor, username):
        return None
    return user_repository.create(cursor, username, generate_password_hash(password), role)


def update_user(cursor, user_id, role=None, active=None, password=None):
    """Returns None if the user doesn't exist."""
    password_hash = generate_password_hash(password) if password else None
    return user_repository.update(cursor, user_id, role, active, password_hash)


def change_own_password(cursor, user, current_password, new_password):
    """Returns the updated user, or None if the current password is wrong."""
    if not check_password_hash(user["password_hash"], current_password):
        return None
    return user_repository.update(cursor, user["id"], password_hash=generate_password_hash(new_password))


def upsert_admin(cursor, username, password):
    """Bootstrap helper: creates the admin, or resets password/role/status if it already exists."""
    existing = user_repository.find_by_username(cursor, username)
    if existing:
        return user_repository.update(
            cursor, existing["id"], role="admin", active=True, password_hash=generate_password_hash(password)
        ), False
    return user_repository.create(cursor, username, generate_password_hash(password), "admin"), True
