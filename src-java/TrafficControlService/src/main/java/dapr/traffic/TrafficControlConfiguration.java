package dapr.traffic;

import dapr.traffic.fines.DefaultFineCollectionClient;
import dapr.traffic.fines.FineCollectionClient;
import dapr.traffic.vehicle.InMemoryVehicleStateRepository;
import dapr.traffic.vehicle.VehicleStateRepository;
import dapr.traffic.violation.DefaultSpeedingViolationCalculator;
import dapr.traffic.violation.SpeedingViolationCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class TrafficControlConfiguration {
    @Value("${traffic.road-id}")
    private String roadId;

    @Value("${traffic.section-length}")
    private int sectionLength;

    @Value("${traffic.speed-limit}")
    private int speedLimit;

    @Value("${traffic.legal-correction}")
    private int legalCorrection;

    @Value("${fine-collection.address}")
    private String fineCollectionAddress;

    @Bean
    public VehicleStateRepository vehicleStateRepository() {
        return new InMemoryVehicleStateRepository();
    }

    @Bean
    public SpeedingViolationCalculator speedingViolationCalculator() {
        return new DefaultSpeedingViolationCalculator(legalCorrection, speedLimit, roadId, sectionLength);
    }

    @Bean
    public FineCollectionClient fineCollectionClient(final RestTemplate restTemplate) {
        return new DefaultFineCollectionClient(fineCollectionAddress, restTemplate);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
