package dapr.simulation;

import dapr.simulation.events.VehicleRegistered;
import org.springframework.integration.dsl.IntegrationFlow;
import org.springframework.messaging.support.GenericMessage;

public class MqttTrafficControlService implements TrafficControlService {
    private final IntegrationFlow entryCamera;
    private final IntegrationFlow exitCamera;

    public MqttTrafficControlService(final IntegrationFlow entryCamera, final IntegrationFlow exitCamera) {
        this.entryCamera = entryCamera;
        this.exitCamera = exitCamera;
    }

    @Override
    public void sendVehicleEntry(final VehicleRegistered event) {
        entryCamera.getInputChannel().send(new GenericMessage<>(event));
    }

    @Override
    public void sendVehicleExit(final VehicleRegistered event) {
        exitCamera.getInputChannel().send(new GenericMessage<>(event));
    }
}