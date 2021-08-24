package dapr.traffic.vehicle;

import java.util.Optional;

public interface VehicleStateRepository {
    VehicleState saveVehicleState(final VehicleState vehicleState);
    Optional<VehicleState> getVehicleState(final String licenseNumber);
}
