class Vehicle:
    def __init__(self, vehicle_id: str, make: str, model: str, owner_name: str, owner_email: str) -> None:
        self.vehicleId = vehicle_id
        self.make = make
        self.model = model
        self.ownerName = owner_name
        self.ownerEmail = owner_email
