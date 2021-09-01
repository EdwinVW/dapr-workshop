from datetime import datetime


class VehicleState:
    def __init__(self, license_number: str, entry_timestamp: datetime, exit_timestamp: datetime):
        self.license_number = license_number
        self.entry_timestamp = entry_timestamp
        self.exit_timestamp = exit_timestamp


class SpeedingViolation:
    def __init__(self, vehicle_id: str, road_id: str, excess_speed: int, timestamp: datetime):
        self.vehicle_id = vehicle_id
        self.road_id = road_id
        self.excess_speed = excess_speed
        self.timestamp = timestamp
