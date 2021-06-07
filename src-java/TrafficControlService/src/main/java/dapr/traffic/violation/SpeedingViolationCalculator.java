package dapr.traffic.violation;

import java.time.LocalDateTime;

public interface SpeedingViolationCalculator {
    int determineSpeedingViolationInKmh(final LocalDateTime entryTimestamp, final LocalDateTime exitTimestamp);
    String getRoadId();
}
