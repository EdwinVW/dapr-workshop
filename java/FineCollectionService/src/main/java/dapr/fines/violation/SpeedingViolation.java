package dapr.fines.violation;

import java.time.LocalDateTime;

public record SpeedingViolation(String licenseNumber,
                                String roadId,
                                int excessSpeed /* in km/h */,
                                LocalDateTime timestamp) {
}
