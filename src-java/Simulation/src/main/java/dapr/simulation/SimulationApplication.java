package dapr.simulation;

import org.springframework.boot.WebApplicationType;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@EnableConfigurationProperties({ SimulationSettings.class })
@SpringBootApplication
public class SimulationApplication {
    public static void main(String[] args) {
        new SpringApplicationBuilder(SimulationApplication.class)
                .web(WebApplicationType.NONE)
                .run(args);
    }
}
