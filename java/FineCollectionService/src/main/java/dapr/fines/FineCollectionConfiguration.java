package dapr.fines;

import dapr.fines.fines.DefaultFineCalculator;
import dapr.fines.fines.FineCalculator;
import dapr.fines.vehicle.DefaultVehicleRegistrationClient;
import dapr.fines.vehicle.VehicleRegistrationClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class FineCollectionConfiguration {
    // We need to pass this key with every invocation of the FineFines library
    @Value("${finefines.license-key}")
    private String fineCalculatorLicenseKey;

    @Value("${vehicle-information.address}")
    private String vehicleInformationAddress;

    @Bean
    public FineCalculator fineCalculator() {
        return new DefaultFineCalculator(fineCalculatorLicenseKey);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public VehicleRegistrationClient vehicleRegistrationClient(final RestTemplate restTemplate) {
        return new DefaultVehicleRegistrationClient(restTemplate, vehicleInformationAddress);
    }
}
