import logging
from fastapi import FastAPI
from fastapi.responses import Response
from . import events, repositories, services, models, clients, settings


logging.config.fileConfig("logging.conf", disable_existing_loggers=False)
logger = logging.getLogger(__name__)

app = FastAPI()
app_settings = settings.ApplicationSettings()

repository = repositories.VehicleStateRepository()
calculator = services.SpeedingViolationCalculator("A12", 10, 100, 5)
fine_collector = clients.FineCollectionClient(app_settings.fine_collection_address)


@app.post("/entrycam")
def entrycam(msg: events.VehicleRegistered):
    logger.info("Vehicle %s entering lane %i at %s", msg.license_number, msg.lane, msg.timestamp)

    state = models.VehicleState(
        license_number=msg.license_number,
        entry_timestamp=msg.timestamp
    )

    repository.set_vehicle_state(state)

    return Response(status_code=200)


@app.post("/exitcam")
def exitcam(msg: events.VehicleRegistered):
    logger.info("Vehicle %s leaving lane %i at %s", msg.license_number, msg.lane, msg.timestamp)

    state = repository.get_vehicle_state(msg.license_number)

    if not state is None:
        state.exit_timestamp = msg.timestamp
    
    repository.set_vehicle_state(state)

    excess_speed = calculator.get_excess_speed(state.entry_timestamp, state.exit_timestamp)

    if excess_speed > 0:
        logger.warn("Vehicle %s is over the speed limit. Collecting fine", state.license_number)
        
        violation = models.SpeedingViolation(
            license_number=state.license_number,
            road_id=calculator.road_id,
            excess_speed=excess_speed,
            timestamp=state.exit_timestamp
        )

        try:
            fine_collector.collect_fine(violation)
        except:
            return Response(status_code=500)

    return Response(status_code=200)