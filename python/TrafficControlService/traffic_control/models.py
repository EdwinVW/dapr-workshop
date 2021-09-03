from datetime import datetime
from pydantic import BaseModel


class VehicleState(BaseModel):
    exit_timestamp: datetime
    entry_timestamp: datetime
    license_number: str


class SpeedingViolation(BaseModel):
    licenseNumber: str
    roadId: str
    violationInKmh: int
    timestamp: datetime
