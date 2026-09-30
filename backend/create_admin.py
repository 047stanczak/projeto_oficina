"""Creates the first admin (or resets an existing admin's password).

Docker:  docker compose -f infra/docker-compose.yml exec -it backend python create_admin.py
Options: ADMIN_USERNAME / ADMIN_PASSWORD env vars skip the prompts.
"""
import getpass
import os
import sys

import validators
from repository.db import get_db
from services import user_service


def main():
    try:
        username = validators.username(os.getenv("ADMIN_USERNAME") or input("Admin username: "))
        password = os.getenv("ADMIN_PASSWORD")
        if not password:
            password = getpass.getpass("Password: ")
            if password != getpass.getpass("Repeat password: "):
                sys.exit("Passwords do not match")
        validators.password(password)
    except validators.ValidationError as e:
        sys.exit(str(e))

    conn = get_db()
    cursor = conn.cursor()
    _, created = user_service.upsert_admin(cursor, username, password)
    conn.commit()
    cursor.close()
    conn.close()
    print(f"Admin '{username}' {'created' if created else 'updated (password reset, role=admin, active)'}.")


if __name__ == "__main__":
    main()
