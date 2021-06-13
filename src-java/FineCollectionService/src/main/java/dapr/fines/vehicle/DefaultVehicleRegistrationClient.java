package dapr.fines.vehicle;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@AllArgsConstructor
@Slf4j
public class DefaultVehicleRegistrationClient implements VehicleRegistrationClient {
    private final RestTemplate restTemplate;
    private final String vehicleInformationAddress;

    @Override
    public VehicleInfo getVehicleInfo(final String licenseNumber) {
        var params = Map.of("licenseNumber", licenseNumber);
        return restTemplate.getForObject(vehicleInformationAddress, VehicleInfo.class);
    }
}
