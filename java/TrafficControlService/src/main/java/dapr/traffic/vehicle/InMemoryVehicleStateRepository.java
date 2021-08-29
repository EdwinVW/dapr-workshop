package dapr.traffic.vehicle;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

public class InMemoryVehicleStateRepository implements VehicleStateRepository {
    private final Map<String, VehicleState> state = new ConcurrentHashMap<>();

    @Override
    public VehicleState saveVehicleState(final VehicleState vehicleState) {
        return state.merge(vehicleState.licenseNumber(), vehicleState, (oldValue, newValue) -> newValue);
    }

    @Override
    public Optional<VehicleState> getVehicleState(final String licenseNumber) {
        return Optional.ofNullable(state.get(licenseNumber));
    }
}
