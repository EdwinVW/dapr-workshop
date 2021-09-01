from datetime import datetime
from pydantic import BaseModel


class VehicleRegistered(BaseModel):
    lane: int
    licenseNumber: str
    timestamp: datetime
