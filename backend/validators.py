import math
import re

from flask import request

MAX_MONEY = 99_999_999.99       # DECIMAL(10, 2)
MAX_MARGIN = 999.99             # DECIMAL(5, 2)
MAX_TAX = 99.99                 # DECIMAL(5, 2), and must stay below 100
MAX_INT = 2_147_483_647         # INT


class ValidationError(ValueError):
    pass


def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ValidationError("A JSON object body is required")
    return data


def number(value, field, minimum=0, maximum=MAX_MONEY):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValidationError(f"{field} must be a number")
    if not math.isfinite(value) or value < minimum or value > maximum:
        raise ValidationError(f"{field} must be between {minimum} and {maximum}")
    return value


def integer(value, field, minimum=0, maximum=MAX_INT, nullable=False):
    if value is None and nullable:
        return None
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValidationError(f"{field} must be an integer")
    if value < minimum or value > maximum:
        raise ValidationError(f"{field} must be between {minimum} and {maximum}")
    return value


def text(value, field, max_len, required=True):
    if value is None and not required:
        return None
    if not isinstance(value, str):
        raise ValidationError(f"{field} must be a string")
    value = value.strip()
    if required and not value:
        raise ValidationError(f"{field} is required")
    if len(value) > max_len:
        raise ValidationError(f"{field} must have at most {max_len} characters")
    return value


def margin(value):
    return number(value, "margin_percentage", 0, MAX_MARGIN)


def tax(value):
    return number(value, "tax_percentage", 0, MAX_TAX)


MAX_UPDATE_ITEMS = 500


def update_items(items):
    if not isinstance(items, list) or len(items) > MAX_UPDATE_ITEMS:
        raise ValidationError(f"updates must be a list with at most {MAX_UPDATE_ITEMS} items")
    result = []
    for item in items:
        if not isinstance(item, dict):
            raise ValidationError("each update must be an object")
        result.append({
            "code": text(item.get("code"), "code", 20),
            "name": text(item.get("name", "Product"), "name", 255),
            "new_cost": number(item.get("new_cost"), "new_cost"),
            "quantity": integer(item.get("quantity", 0), "quantity"),
        })
    return result


USERNAME_RE = re.compile(r"^[a-z0-9._-]{3,50}$")
ROLES = ("admin", "member")
PASSWORD_MIN = 10
PASSWORD_MAX = 128  # scrypt cost grows with input size, so cap it


def username(value):
    if not isinstance(value, str):
        raise ValidationError("username must be a string")
    value = value.strip().lower()
    if not USERNAME_RE.match(value):
        raise ValidationError("username must have 3-50 characters: letters, digits, '.', '_' or '-'")
    return value


def password(value, field="password"):
    if not isinstance(value, str):
        raise ValidationError(f"{field} must be a string")
    if not PASSWORD_MIN <= len(value) <= PASSWORD_MAX:
        raise ValidationError(f"{field} must have {PASSWORD_MIN}-{PASSWORD_MAX} characters")
    return value


def role(value):
    if value not in ROLES:
        raise ValidationError("role must be 'admin' or 'member'")
    return value


def boolean(value, field):
    if not isinstance(value, bool):
        raise ValidationError(f"{field} must be true or false")
    return value
