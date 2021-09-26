import random
from threading import Thread
from time import sleep
from datetime import datetime
from . import clients, events


ALLOWED_CHARS = ["D", "F", "G", "H", "J", "K", "L", "N", "P", "R", "S", "T", "X", "Y", "Z"]


def generate_license_number():
    license_type = random.randrange(0, 8)

    def random_chars(length):
        chars = [random.choice(ALLOWED_CHARS) for _ in range(length)]
        return str.join("", chars)

    if license_type == 0:  # 99-AA-99
        return f"{random.randrange(1,100):02}-{random_chars(2)}-{random.randrange(1,100):02}"
    elif license_type == 1:  # AA-99-AA
        return f"{random_chars(2)}-{random.randrange(1,100):02}-{random_chars(2)}"
    elif license_type == 2:  # AA-AA-99
        return f"{random_chars(2)}-{random_chars(2)}-{random.randrange(0,100):02}"
    elif license_type == 3:  # 99-AA-AA
        return f"{random.randrange(1,100):02}-{random_chars(2)}-{random_chars(2)}"
    elif license_type == 4:  # 99-AAA-9
        return f"{random.randrange(1,100):02}-{random_chars(3)}-{random.randrange(1,10)}"
    elif license_type == 5:  # 9-AAA-99
        return f"{random.randrange(1,10)}-{random_chars(3)}-{random.randrange(1,100):02}"
    elif license_type == 6:  # AA-999-A
        return f"{random_chars(2)}-{random.randrange(1,1000):03}-{random_chars(1)}"
    elif license_type == 7:  # A-999-AA
        return f"{random_chars(1)}-{random.randrange(1,1000):03}-{random_chars(2)}"

    return None


class CameraSimulation:
    def __init__(self, lanes: int, client: clients.TrafficControlClient) -> None:
        self.client = client
        self.camera_running = False
        self.lanes = lanes

        self.camera_thread = Thread(
            target=self.processing_loop
        )

    def start(self):
        self.camera_thread.start()

    def stop(self):
        self.camera_running = False
        self.camera_thread.join()

    def processing_loop(self):
        self.camera_running = True

        while self.camera_running:
            sleep(random.randrange(50, 5000) / 1000)  # wait for a little bit before sending the next car in.

            license_number = generate_license_number()
            lane_number = random.randint(1, self.lanes)

            self.client.send_vehicle_entry(events.VehicleRegistered(
                lane=lane_number,
                licenseNumber=license_number,
                timestamp=datetime.now()
            ))

            print(f"Simulated ENTRY of vehicle with license number {license_number} in lane {lane_number}")

            sleep(random.randrange(1, 4))  # wait before exiting the lane on the other side.

            lane_number = random.randint(1, self.lanes)

            self.client.send_vehicle_exit(events.VehicleRegistered(
                lane=lane_number,
                licenseNumber=license_number,
                timestamp=datetime.now()
            ))

            print(f"Simulated EXIT of vehicle with license number {license_number} in lane {lane_number}")
