import os

DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "oficina_db"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", "postgres"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
