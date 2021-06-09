package dapr.simulation;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
public class SimulationConfiguration {
    private final SimulationSettings settings;
    private final String trafficEntryAddress;
    private final String trafficExitAddress;

    public SimulationConfiguration(final SimulationSettings settings,
                                   @Value("${traffic-control.entry.address}") final String trafficEntryAddress,
                                   @Value("${traffic-control.exit.address}") final String trafficExitAddress) {
        this.settings = settings;
        this.trafficEntryAddress = trafficEntryAddress;
        this.trafficExitAddress = trafficExitAddress;
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public ExecutorService executorService() {
        return Executors.newFixedThreadPool(settings.getNumLanes());
    }

    @Bean
    public TrafficControlService trafficControlService(final RestTemplate restTemplate) {
        return new HttpTrafficControlService(trafficEntryAddress, trafficExitAddress, restTemplate);
    }
}
