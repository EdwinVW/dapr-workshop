from fastapi import FastAPI
from . import models, repositories


app = FastAPI()


@app.get("/vehicleinfo/{license_number:str}")
def get_vehicle_info(license_number: str) -> models.Vehicle or None:
    repository = repositories.VehicleRepository()
    result = repository.get_vehicle_info(license_number)

    return result
