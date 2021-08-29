package dapr.traffic.vehicle;

import java.time.LocalDateTime;

public record VehicleRegistered(int lane,
                                String licenseNumber,
                                LocalDateTime timestamp) {
}
