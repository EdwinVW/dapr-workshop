import requests
import json
from pydantic import BaseModel


class Vehicle(BaseModel):
    vehicle_id: str
    make: str
    model: str
    owner_name: str
    owner_email: str
    

class VehicleRegistrationClient:
    def __init__(self, base_address: str):
        self.base_address = base_address

    def get_vehicle_info(self, license_number):
        response = requests.get(f"{self.base_address}/vehicleinfo/{license_number}")
        response_data = Vehicle.parse_raw(response.content)

        return response_data