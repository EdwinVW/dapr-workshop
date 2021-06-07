package dapr.traffic.fines;

import dapr.traffic.violation.SpeedingViolation;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestTemplate;

@AllArgsConstructor
@Slf4j
public class DefaultFineCollectionClient implements FineCollectionClient {
    private final String fineCollectionEndpoint;
    private final RestTemplate restTemplate;

    @Override
    public void submitForFine(final SpeedingViolation speedingViolation) {
        restTemplate.postForObject(fineCollectionEndpoint, speedingViolation, Void.class);
    }
}
