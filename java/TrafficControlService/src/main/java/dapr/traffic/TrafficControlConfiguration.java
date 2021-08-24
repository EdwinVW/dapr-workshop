package dapr.traffic;

import dapr.traffic.fines.DefaultFineCollectionClient;
import dapr.traffic.fines.FineCollectionClient;
import dapr.traffic.vehicle.InMemoryVehicleStateRepository;
import dapr.traffic.vehicle.VehicleStateRepository;
import dapr.traffic.violation.DefaultSpeedingViolationCalculator;
import dapr.traffic.violation.SpeedingViolationCalculator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
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
    public RestTemplate restTemplate(Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder) {
        // The Spring-configured ObjectMapper writes timestamps as ISO string, in contrast to the
        // default Jackson ObjectMapper that the RestTemplate constructor uses and that does not.
        var objectMapper = jacksonObjectMapperBuilder.build();
        return new RestTemplateBuilder()
                .messageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }
}
