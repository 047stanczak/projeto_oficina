from dataclasses import dataclass


@dataclass
class Product:
    id: int
    code: str
    name: str
    current_cost: float
    sale_price: float
    stock: int
    min_stock: int | None
