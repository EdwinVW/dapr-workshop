from . import clients, models, templates


class FineCalculator:
    def __init__(self, license_key: str) -> None:
        self._license_key = license_key

    def calculate_fine(self, excess_speed: int) -> int:
        fine = 9  # Default administration costs

        if self._license_key != "HX783-K2L7V-CRJ4A-5PN1G":
            raise ValueError("Invalid license key")

        if excess_speed < 5:
            fine += 18
        elif excess_speed < 10:
            fine += 31
        elif excess_speed < 15:
            fine += 64
        elif excess_speed < 20:
            fine += 121
        elif excess_speed < 25:
            fine += 174
        elif excess_speed < 30:
            fine += 232
        elif excess_speed < 35:
            fine += 297
        elif excess_speed == 35:
            fine += 372
        else:
            return -1

        return fine


class ViolationProcessor:
    def __init__(self, calculator: FineCalculator, vehicle_registrations: clients.VehicleRegistrationClient) -> None:
        self.calculator = calculator
        self.vehicle_registrations = vehicle_registrations

    def process_speed_violation(self, violation: models.SpeedingViolation) -> None:
        fine = self.calculator.calculate_fine(violation.violationInKmh)
        fine_text = "To be decided by the prosecutor" if fine == -1 else f"EUR {fine:.2f}"
        vehicle = self.vehicle_registrations.get_vehicle_info(violation.licenseNumber)

        message_body = templates.render(
            "email.html",
            owner=vehicle.ownerName,
            date=violation.timestamp.date(),
            time=violation.timestamp.time(),
            license_number=vehicle.vehicleId,
            brand=vehicle.make,
            model=vehicle.model,
            road_id=violation.roadId,
            speed=violation.violationInKmh,
            fine_text=fine_text
        )

        # TODO: Send the fine notification per email