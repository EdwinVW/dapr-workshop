package dapr.simulation;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Configuration
@RequiredArgsConstructor
public class SimulationConfiguration {
    private final SimulationSettings settings;

    @Value("${traffic-control.entry.address}")
    private String trafficEntryAddress;

    @Value("${traffic-control.exit.address}")
    private String trafficExitAddress;

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
        return new DefaultTrafficControlService(trafficEntryAddress, trafficExitAddress, restTemplate);
    }
}
