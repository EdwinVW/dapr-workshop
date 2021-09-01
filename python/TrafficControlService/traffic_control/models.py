from datetime import datetime
from pydantic import BaseModel

class VehicleState:
    exit_timestamp: datetime

    def __init__(self, license_number: str, entry_timestamp: datetime):
        self.license_number = license_number
        self.entry_timestamp = entry_timestamp
        self.exit_timestamp = None


class SpeedingViolation(BaseModel):
    license_number: str
    road_id: str
    excess_speed: int
    timestamp: datetime

