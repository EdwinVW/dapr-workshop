package dapr.traffic.vehicle;

import java.time.LocalDateTime;

public record VehicleState(String licenseNumber,
                           LocalDateTime entryTimestamp,
                           LocalDateTime exitTimestamp) {
    public VehicleState(final String licenseNumber, final LocalDateTime entryTimestamp) {
        this(licenseNumber, entryTimestamp, null);
    }

    public VehicleState withExit(final LocalDateTime timestamp) {
        return new VehicleState(licenseNumber, entryTimestamp, timestamp);
    }
}
