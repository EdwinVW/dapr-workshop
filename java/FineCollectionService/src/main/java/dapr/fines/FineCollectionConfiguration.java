package dapr.fines;

import io.dapr.client.DaprClient;
import io.dapr.client.DaprClientBuilder;
import dapr.fines.fines.DefaultFineCalculator;
import dapr.fines.fines.FineCalculator;
import dapr.fines.vehicle.DaprVehicleRegistrationClient;
import dapr.fines.vehicle.DefaultVehicleRegistrationClient;
import dapr.fines.vehicle.VehicleRegistrationClient;
import io.dapr.client.DaprClient;
import io.dapr.client.DaprClientBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class FineCollectionConfiguration {
    @Bean
    public String fineCalculatorLicenseKey(final DaprClient daprClient) {
        return daprClient.getSecret("trafficcontrol-secrets", "finecalculator.licensekey")
                .block()
                .get("finecalculator.licensekey");
    }

    @Value("${vehicle-information.address}")
    private String vehicleInformationAddress;

    @Bean
    public FineCalculator fineCalculator(final String fineCalculatorLicenseKey) {
        return new DefaultFineCalculator(fineCalculatorLicenseKey);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public VehicleRegistrationClient vehicleRegistrationClient(final DaprClient daprClient) {
        return new DaprVehicleRegistrationClient(daprClient);
    }

    @Bean
    public DaprClient daprClient() {
        return new DaprClientBuilder().build();
    }
}
