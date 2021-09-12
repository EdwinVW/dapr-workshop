package dapr.traffic.fines;

import dapr.traffic.violation.SpeedingViolation;
import io.dapr.client.DaprClient;

public class DaprFineCollectionClient implements FineCollectionClient {
    private final DaprClient daprClient;

    public DaprFineCollectionClient(final DaprClient daprClient) {
        this.daprClient = daprClient;
    }

    @Override
    public void submitForFine(SpeedingViolation speedingViolation) {
        daprClient.publishEvent("pubsub",  "speedingviolations", speedingViolation).block();
    }
}