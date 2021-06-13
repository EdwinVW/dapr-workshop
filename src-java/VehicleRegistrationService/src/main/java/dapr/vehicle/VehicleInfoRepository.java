package dapr.vehicle;

public interface VehicleInfoRepository {
    VehicleInfo getVehicleInfo(final String licenseNumber);
}
