package dapr.fines.vehicle;

import io.dapr.client.DaprClient;
import io.dapr.client.domain.HttpExtension;

import java.time.Duration;

public class DaprVehicleRegistrationClient implements VehicleRegistrationClient {
    private final DaprClient daprClient;

    public DaprVehicleRegistrationClient(final DaprClient daprClient) {
        this.daprClient = daprClient;
    }

    @Override
    public VehicleInfo getVehicleInfo(final String licenseNumber) {
        var result = daprClient.invokeMethod(
                "vehicleregistrationservice",
                "vehicleinfo/" + licenseNumber,
                null,
                HttpExtension.GET,
                VehicleInfo.class
        );

        return result.block(Duration.ofMillis(100));
    }

}