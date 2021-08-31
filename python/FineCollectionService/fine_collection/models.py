from pydantic import BaseModel
from datetime import datetime

class SpeedingViolation(BaseModel):
    license_number: str
    road_id: str
    excess_speed: int
    timestamp: datetime
