package dapr.traffic.fines;

import dapr.traffic.violation.SpeedingViolation;

public interface FineCollectionClient {
    void submitForFine(final SpeedingViolation speedingViolation);
}
