package dapr.traffic.violation;

import java.time.Duration;
import java.time.LocalDateTime;

public class DefaultSpeedingViolationCalculator implements SpeedingViolationCalculator {
    private final int legalCorrectionInKmh;
    private final int maxAllowedSpeedInKmh;
    private final String roadId;
    private final int sectionLengthInKm;

    public DefaultSpeedingViolationCalculator(final int legalCorrectionInKmh,
                                              final int maxAllowedSpeedInKmh,
                                              final String roadId,
                                              final int sectionLengthInKm) {
        this.legalCorrectionInKmh = legalCorrectionInKmh;
        this.maxAllowedSpeedInKmh = maxAllowedSpeedInKmh;
        this.roadId = roadId;
        this.sectionLengthInKm = sectionLengthInKm;
    }

    @Override
    public int determineExcessSpeed(final LocalDateTime entryTimestamp, final LocalDateTime exitTimestamp) {
        // In this simulation, 1 second clock time == 1 minute simulation time.
        final long elapsedMinutes = Duration.between(entryTimestamp, exitTimestamp).getSeconds();
        final double elapsedHours = (double) elapsedMinutes / 60;
        final double avgSpeedInKmh = sectionLengthInKm / elapsedHours;

        final int violation = (int) (avgSpeedInKmh - (double) maxAllowedSpeedInKmh - (double) legalCorrectionInKmh);
        return Math.max(0, violation); // never return negative violation, doesn't make sense
    }

    @Override
    public String getRoadId() {
        return this.roadId;
    }
}
