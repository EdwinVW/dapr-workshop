package dapr.simulation;

import dapr.simulation.events.VehicleRegistered;

public interface TrafficControlService {
    void sendVehicleEntry(final VehicleRegistered vehicleRegistered);
    void sendVehicleExit(final VehicleRegistered vehicleRegistered);
}
