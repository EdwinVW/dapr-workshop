package dapr.simulation;

import dapr.simulation.events.VehicleRegistered;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.RequestEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@RequiredArgsConstructor
@Slf4j
public class DefaultTrafficControlService implements TrafficControlService {
    private final String trafficEntryAddress;
    private final String trafficExitAddress;
    private final RestTemplate restTemplate;

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
