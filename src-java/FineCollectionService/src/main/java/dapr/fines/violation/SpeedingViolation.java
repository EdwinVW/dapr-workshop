package dapr.fines.violation;

import java.time.LocalDateTime;

public record SpeedingViolation(String licensePlate,
                                String roadId,
                                int excessSpeed /* in km/h */,
                                LocalDateTime timestamp) {
}
