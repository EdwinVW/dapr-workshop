from datetime import datetime


class SpeedingViolationCalculator:
    def __init__(self, road_id: str, section_length: int, max_speed: int, legal_correction: int) -> None:
        self.road_id = road_id
        self.section_length = section_length
        self.max_speed = max_speed
        self.legal_correction = legal_correction

    def get_excess_speed(self, entry_timestamp: datetime, exit_timestamp: datetime) -> int:
        time_diff = exit_timestamp - entry_timestamp
        time_diff_seconds = time_diff.total_seconds()

        speed = round((self.section_length / time_diff_seconds) * 60)
        excess_speed = int(speed - self.max_speed - self.legal_correction)

        return excess_speed if excess_speed > 0 else 0
