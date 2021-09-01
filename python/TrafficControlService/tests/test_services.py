from datetime import datetime
from traffic_control import services


def test_excess_speed_over_max():
    service = services.SpeedingViolationCalculator("A12", 10, 100, 3)
    excess_speed = service.get_excess_speed(
        datetime(2021, 9, 1, 7, 45, 0),
        datetime(2021, 9, 1, 7, 45, 5)
    )

    assert excess_speed == 17


def test_excess_speed_under_max():
    service = services.SpeedingViolationCalculator("A12", 10, 100, 3)
    excess_speed = service.get_excess_speed(
        datetime(2021, 9, 1, 7, 45, 0),
        datetime(2021, 9, 1, 7, 45, 15)
    )

    assert excess_speed == 0
