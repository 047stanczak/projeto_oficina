from dataclasses import dataclass
from typing import Optional


@dataclass
class PricingRule:
    margin_percentage: float
    tax_percentage: float
    id: Optional[int] = None
    product_id: Optional[int] = None