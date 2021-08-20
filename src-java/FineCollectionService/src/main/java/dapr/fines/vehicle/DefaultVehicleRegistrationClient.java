package dapr.fines.vehicle;

import org.springframework.web.client.RestTemplate;

import java.util.Map;

public class DefaultVehicleRegistrationClient implements VehicleRegistrationClient {
    private final RestTemplate restTemplate;
    private final String vehicleInformationAddress;

    public DefaultVehicleRegistrationClient(final RestTemplate restTemplate,
                                            final String vehicleInformationAddress) {
        this.restTemplate = restTemplate;
        this.vehicleInformationAddress = vehicleInformationAddress;
    }

    @Override
    public VehicleInfo getVehicleInfo(final String licenseNumber) {
        var params = Map.of("licenseNumber", licenseNumber);
        return restTemplate.getForObject(vehicleInformationAddress, VehicleInfo.class, params);
    }
}
