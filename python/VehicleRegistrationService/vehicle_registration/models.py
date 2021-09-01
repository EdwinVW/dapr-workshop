class Vehicle:
    def __init__(self, vehicle_id: str, make: str, model: str, owner_name: str, owner_email: str) -> None:
        self.vehicle_id = vehicle_id
        self.make = make
        self.model = model
        self.owner_name = owner_name
        self.owner_email = owner_email