from datetime import datetime


class VehicleRegistered:
    def __init__(self, lane: int, license_number: str, timestamp: datetime) -> None:
        self.license_number = license_number
        self.lane = lane
        self.timestamp = timestamp
