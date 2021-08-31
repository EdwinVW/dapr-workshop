import logging


logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


class ViolationProcessor:
    def __init__(self, calculator, vehicle_registrations):
        self.calculator = calculator
        self.vehicle_registrations = vehicle_registrations

    def process_speed_violation(self, violation):
        fine = self.calculator.calculate_fine(violation.excess_speed)
        fine_text = "To be decided by the prosecutor" if fine == -1 else f"EUR {fine:.2f}"
        vehicle = self.vehicle_registrations.get_vehicle_info(violation.license_number)

        # TODO: Send the fine notification per email

        logger.info("Sent fine notification")