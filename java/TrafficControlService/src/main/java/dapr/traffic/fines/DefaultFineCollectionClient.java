package dapr.traffic.fines;

import dapr.traffic.violation.SpeedingViolation;
import org.springframework.web.client.RestTemplate;

public class DefaultFineCollectionClient implements FineCollectionClient {
    private final String fineCollectionEndpoint;
    private final RestTemplate restTemplate;

    public DefaultFineCollectionClient(final String fineCollectionEndpoint,
                                       final RestTemplate restTemplate) {
        this.fineCollectionEndpoint = fineCollectionEndpoint;
        this.restTemplate = restTemplate;
    }

    @Override
    public void submitForFine(final SpeedingViolation speedingViolation) {
        restTemplate.postForObject(fineCollectionEndpoint, speedingViolation, Void.class);
    }
}
