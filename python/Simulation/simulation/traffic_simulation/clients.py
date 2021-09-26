import requests
from . import events


class ClientError(Exception):
    def __init__(self, message: str) -> None:
        super().__init__(message)


class TrafficControlClient:
    def __init__(self, base_address: str):
        self.base_address = base_address

    def send_vehicle_entry(self, evt: events.VehicleRegistered):
        request_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        response = requests.post(
            url=f"{self.base_address}/entrycam", 
            data=evt.json(),
            headers=request_headers)

        if response.status_code != 200:
            raise ClientError(f"Could not process vehicle entry request. Got status {response.status_code}: {str(response.content)}")

    def send_vehicle_exit(self, evt: events.VehicleRegistered):
        request_headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

        response = requests.post(
            url=f"{self.base_address}/exitcam", 
            data=evt.json(),
            headers=request_headers)

        if response.status_code != 200:
            raise ClientError(f"Could not process vehicle exit request. Got status {response.status_code}: {str(response.content)}")