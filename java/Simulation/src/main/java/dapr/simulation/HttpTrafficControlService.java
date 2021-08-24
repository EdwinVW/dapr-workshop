package dapr.simulation;

import dapr.simulation.events.VehicleRegistered;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

public class HttpTrafficControlService implements TrafficControlService {
    private static final Logger log = LoggerFactory.getLogger(HttpTrafficControlService.class);

    private final String trafficEntryAddress;
    private final String trafficExitAddress;
    private final RestTemplate restTemplate;

    public HttpTrafficControlService(final String trafficEntryAddress,
                                     final String trafficExitAddress,
                                     final RestTemplate restTemplate) {
        this.trafficEntryAddress = trafficEntryAddress;
        this.trafficExitAddress = trafficExitAddress;
        this.restTemplate = restTemplate;
    }

    @Override
    public void sendVehicleEntry(final VehicleRegistered vehicleRegistered) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var entity = new HttpEntity<>(vehicleRegistered, headers);

        try {
            restTemplate.postForObject(trafficEntryAddress, entity, Void.class);
        } catch (RestClientException rce) {
            log.error("Could not register entry for license number {}: {}", vehicleRegistered.licenseNumber(),
                    rce.getLocalizedMessage());
        }
    }

    @Override
    public void sendVehicleExit(final VehicleRegistered vehicleRegistered) {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var entity = new HttpEntity<>(vehicleRegistered, headers);

        try {
            restTemplate.postForObject(trafficExitAddress, entity, Void.class);
        } catch (RestClientException rce) {
            log.error("Could not register exit for license number {}: {}", vehicleRegistered.licenseNumber(),
                    rce.getLocalizedMessage());
        }
    }
}
