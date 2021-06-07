package dapr.traffic.violation;

import java.time.LocalDateTime;

public record SpeedingViolation(String vehicleId,
                                String roadId,
                                int violationInKmh,
                                LocalDateTime timestamp) {
}
