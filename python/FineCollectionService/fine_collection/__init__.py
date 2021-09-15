from fastapi import FastAPI
from fastapi.responses import Response
from . import models, settings, services, clients
from os import environ


app = FastAPI()
app_settings = settings.ApplicationSettings()

license_key = app_settings.license_key

processor = services.ViolationProcessor(
    services.FineCalculator(license_key),
    clients.VehicleRegistrationClient(app_settings.vehicle_registration_address)
)


@app.post("/collectfine")
def collect_fine(violation: models.SpeedingViolation) -> Response:
    processor.process_speed_violation(violation)

    return Response(status_code=200)
