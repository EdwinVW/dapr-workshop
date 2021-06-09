package dapr.simulation;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;

@ConstructorBinding
@ConfigurationProperties("simulation")
@Getter
@RequiredArgsConstructor
public class SimulationSettings {
    private final int numLanes;
    private final DelaySettings entryDelay;
    private final DelaySettings exitDelay;

    @ConstructorBinding
    @Getter
    @RequiredArgsConstructor
    static class DelaySettings {
        private final int minimum;
        private final int maximum;
    }
}
