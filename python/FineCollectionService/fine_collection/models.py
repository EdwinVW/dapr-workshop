from pydantic import BaseModel
from datetime import datetime


class SpeedingViolation(BaseModel):
    licenseNumber: str
    roadId: str
    violationInKmh: int
    timestamp: datetime
