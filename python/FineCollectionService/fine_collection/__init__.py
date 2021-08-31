from fastapi import FastAPI
from fastapi.responses import Response
from . import models, processing, calculator, settings, clients



app = FastAPI()
settings = settings.ApplicationSettings()


@app.post("/collectfine")
def collect_fine(violation: models.SpeedingViolation):
    processor = processing.ViolationProcessor(
        calculator.FineCalculator(), 
        clients.VehicleRegistrationClient(settings.vehicle_registration_address)
    )
    
    processor.process_speed_violation(violation)

    return Response(status_code=200)