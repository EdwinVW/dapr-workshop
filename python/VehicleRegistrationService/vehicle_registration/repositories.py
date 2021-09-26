import random
from faker import Faker
from . import models


MAKES = [
    "Mercedes", "Toyota", "Audi", "Volkswagen", "Seat", "Renault", "Skoda",
    "Kia", "Citroën", "Suzuki", "Mitsubishi", "Fiat", "Opel"
]

TYPES = dict([
    ("Mercedes", ["A Class", "B Class", "C Class", "E Class", "SLS", "SLK"]),
    ("Toyota", ["Yaris", "Avensis", "Rav 4", "Prius", "Celica"]),
    ("Audi", ["A3", "A4", "A6", "A8", "Q5", "Q7"]),
    ("Volkswagen", ["Golf", "Pasat", "Tiguan", "Caddy"]),
    ("Seat", ["Leon", "Arona", "Ibiza", "Alhambra"]),
    ("Renault", ["Megane", "Clio", "Twingo", "Scenic", "Captur"]),
    ("Skoda", ["Octavia", "Fabia", "Superb", "Karoq", "Kodiaq"]),
    ("Kia", ["Picanto", "Rio", "Ceed", "XCeed", "Niro", "Sportage"]),
    ("Citroën", ["C1", "C2", "C3", "C4", "C4 Cactus", "Berlingo"]),
    ("Suzuki", ["Ignis", "Swift", "Vitara", "S-Cross", "Swace", "Jimny"]),
    ("Mitsubishi", ["Space Star", "ASX", "Eclipse Cross", "Outlander PHEV"]),
    ("Ford", ["Focus", "Ka", "C-Max", "Fusion", "Fiesta", "Mondeo", "Kuga"]),
    ("BMW", ["500", "Panda", "Punto", "Tipo", "Multipla"]),
    ("Opel", ["Karl", "Corsa", "Astra", "Crossland X", "Insignia"]),
    ("Fiat", ["500", "Panda", "Punto", "Tipo", "Multipla"]),
    ("Opel", ["Karl", "Corsa", "Astra", "Crossland X", "Insignia"])
])


class VehicleRepository:
    def __init__(self) -> None:
        self.data_generator = Faker()

    def get_vehicle_info(self, license_number: str) -> models.Vehicle:
        make = random.choice(MAKES)
        type = random.choice(TYPES[make])
        owner_name = self.data_generator.name()
        owner_email = self.data_generator.ascii_email()

        return models.Vehicle(
            license_number, 
            make, 
            type, 
            owner_name,
            owner_email
        )
