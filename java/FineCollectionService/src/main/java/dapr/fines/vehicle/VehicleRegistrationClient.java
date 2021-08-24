package dapr.fines.vehicle;

public interface VehicleRegistrationClient {
    VehicleInfo getVehicleInfo(final String licenseNumber);
}
