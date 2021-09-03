from datetime import datetime
from pydantic import BaseModel
from typing import Optional


class VehicleState(BaseModel):
    exit_timestamp: Optional[datetime]
    entry_timestamp: datetime
    license_number: str


class SpeedingViolation(BaseModel):
    licenseNumber: str
    roadId: str
    violationInKmh: int
    timestamp: datetime
