package dapr.traffic.violation;

import java.time.LocalDateTime;

public record SpeedingViolation(String licenseNumber,
                                String roadId,
                                int excessSpeed,
                                LocalDateTime timestamp) {
}
