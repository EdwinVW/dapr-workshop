package dapr.simulation;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.ConstructorBinding;

@ConstructorBinding
@ConfigurationProperties("simulation")
public class SimulationSettings {
    private final int numLanes;
    private final DelaySettings entryDelay;
    private final DelaySettings exitDelay;

    public SimulationSettings(final int numLanes,
                              final DelaySettings entryDelay,
                              final DelaySettings exitDelay) {
        this.numLanes = numLanes;
        this.entryDelay = entryDelay;
        this.exitDelay = exitDelay;
    }

    public int getNumLanes() {
        return numLanes;
    }

    public DelaySettings getEntryDelay() {
        return entryDelay;
    }

    public DelaySettings getExitDelay() {
        return exitDelay;
    }

    @ConstructorBinding
    static class DelaySettings {
        private final int minimum;
        private final int maximum;

        public DelaySettings(final int minimum, final int maximum) {
            this.minimum = minimum;
            this.maximum = maximum;
        }

        public int getMinimum() {
            return minimum;
        }

        public int getMaximum() {
            return maximum;
        }
    }
}
