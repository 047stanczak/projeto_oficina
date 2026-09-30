from flask import session
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


def user_or_ip():
    """Rate-limit key: the logged-in user when there is a session, otherwise the client IP."""
    uid = session.get("user_id")
    return f"user:{uid}" if uid else f"ip:{get_remote_address()}"


# In-memory storage: counters live in the process, so gunicorn must run with a single worker.
limiter = Limiter(
    key_func=user_or_ip,
    default_limits=["300 per minute"],
    storage_uri="memory://",
    headers_enabled=True,
)
