from . import models


class VehicleStateRepository:
    def __init__(self):
        self.state = {}

    def get_vehicle_state(self, license_number: str) -> models.VehicleState or None:
        if license_number in self.state:
            return self.state[license_number]
        else:
            return None

    def set_vehicle_state(self, vehicle_state: models.VehicleState) -> None:
        self.state[vehicle_state.license_number] = vehicle_state
