package dapr.traffic.violation;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Duration;
import java.time.LocalDateTime;

@AllArgsConstructor
public class DefaultSpeedingViolationCalculator implements SpeedingViolationCalculator {
    @Getter
    private final String roadId;
    private final int sectionLengthInKm;
    private final int maxAllowedSpeedInKmh;
    private final int legalCorrectionInKmh;

    @Override
    public int determineExcessSpeed(final LocalDateTime entryTimestamp, final LocalDateTime exitTimestamp) {
        // In this simulation, 1 second clock time == 1 minute simulation time.
        final long elapsedMinutes = Duration.between(entryTimestamp, exitTimestamp).getSeconds();
        final double elapsedHours = (double) elapsedMinutes / 60;
        final double avgSpeedInKmh = sectionLengthInKm / elapsedHours;

        final int violation = (int) (avgSpeedInKmh - (double) maxAllowedSpeedInKmh - (double) legalCorrectionInKmh);
        return Math.max(0, violation); // never return negative violation, doesn't make sense
    }
}
