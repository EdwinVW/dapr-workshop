package dapr.fines.vehicle;

public record VehicleInfo(String vehicleId,
                          String make,
                          String model,
                          String ownerName,
                          String ownerEmail) {
}
