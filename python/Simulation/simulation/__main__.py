import time
from traffic_simulation import settings,services, clients

app_settings = settings.ApplicationSettings()

agents = [
    services.CameraSimulation(3, clients.TrafficControlClient(app_settings.traffic_control_address)) 
    for _ in range(3)
]

for index, agent in enumerate(agents):
    print(f"Starting agent {index}...")
    agent.start()

print("Simulation started. Press Ctrl+C to exit.")

try:
    while True:
        time.sleep(0.1)
except KeyboardInterrupt:
    print("Shutting down...")

    for index, agent in enumerate(agents):
        agent.stop()
        print(f"Stopped agent {index}")
