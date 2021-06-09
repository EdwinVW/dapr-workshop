package dapr.simulation.events;

import java.time.LocalDateTime;

public record VehicleRegistered(int lane,
                                String licensePlate,
                                LocalDateTime timestamp) {
}
