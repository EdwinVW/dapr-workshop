import requests
from pydantic import BaseModel


class ClientError(Exception):
    def  __init__(self, message: str):
        super().__init__(message)


class Vehicle(BaseModel):
    vehicle_id: str
    make: str
    model: str
    owner_name: str
    owner_email: str
    

class VehicleRegistrationClient:
    def __init__(self, base_address: str):
        self.base_address = base_address

    def get_vehicle_info(self, license_number: str) -> Vehicle:
        response = requests.get(f"{self.base_address}/vehicleinfo/{license_number}")

        if response.status_code == 200:
            return Vehicle.parse_raw(response.content)
        
        raise ClientError("Failed to retrieve vehicle data. Got status %i: %s", response.status_code, str(response.content))