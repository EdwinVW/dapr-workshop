from datetime import datetime
from pydantic import BaseModel


class VehicleRegistered(BaseModel):
    lane: int
    license_number: str
    timestamp: datetime
