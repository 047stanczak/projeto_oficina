import os


def _required(name):
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Environment variable {name} is required")
    return value


DB_CONFIG = {
    "dbname": os.getenv("DB_NAME", "oficina_db"),
    "user": _required("DB_USER"),
    "password": _required("DB_PASSWORD"),
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
}

SECRET_KEY = _required("SECRET_KEY")
if len(SECRET_KEY) < 32:
    raise RuntimeError("SECRET_KEY must have at least 32 characters")

# The session cookie is only sent over HTTPS. Set COOKIE_SECURE=0 only for local development over plain HTTP.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "1") != "0"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
