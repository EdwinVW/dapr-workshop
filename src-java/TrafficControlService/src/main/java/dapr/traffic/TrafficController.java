package dapr.traffic;

import dapr.traffic.fines.FineCollectionClient;
import dapr.traffic.vehicle.VehicleRegistered;
import dapr.traffic.vehicle.VehicleState;
import dapr.traffic.vehicle.VehicleStateRepository;
import dapr.traffic.violation.SpeedingViolation;
import dapr.traffic.violation.SpeedingViolationCalculator;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.format.DateTimeFormatter;

@AllArgsConstructor
@RestController
@Slf4j
public class TrafficController {
    private static final DateTimeFormatter TIMESTAMP_FORMATTER = DateTimeFormatter.ISO_TIME;

    private final VehicleStateRepository repository;
    private final SpeedingViolationCalculator speedingViolationCalculator;
    private final FineCollectionClient fineCollectionClient;

    @PostMapping(path = "/entrycam")
    public ResponseEntity<Void> vehicleEntry(@RequestBody final VehicleRegistered request) {
        log.info("ENTRY detected in lane {} at {} of vehicle with license number {}.",
                request.lane(), TIMESTAMP_FORMATTER.format(request.timestamp()), request.licenseNumber());

        var state = new VehicleState(request.licenseNumber(), request.timestamp());
        repository.saveVehicleState(state);

        return ResponseEntity.accepted().build();
    }

    @PostMapping(path = "/exitcam")
    public ResponseEntity<Void> vehicleExit(@RequestBody final VehicleRegistered request) {
        return repository.getVehicleState(request.licenseNumber())
                .map(state -> this.storeVehicleExit(state, request))
                .map(state -> this.handlePossibleSpeedingViolation(state))
                .map(state -> ResponseEntity.accepted().<Void>build())
                .orElse(ResponseEntity.notFound().build());
    }

    private VehicleState storeVehicleExit(final VehicleState existingState, final VehicleRegistered request) {
        log.info(" EXIT detected in lane {} at {} of vehicle with license number {}.",
                request.lane(), TIMESTAMP_FORMATTER.format(request.timestamp()), request.licenseNumber());
        return repository.saveVehicleState(existingState.withExit(request.timestamp()));
    }

    private VehicleState handlePossibleSpeedingViolation(final VehicleState state) {
        var excessSpeed = this.speedingViolationCalculator.determineExcessSpeed(
                state.entryTimestamp(),
                state.exitTimestamp()
        );

        if (excessSpeed > 0) {
            log.info("Speeding violation by vehicle {} detected: {} km/h", state.licenseNumber(), excessSpeed);
            var violation = new SpeedingViolation(
                    state.licenseNumber(),
                    speedingViolationCalculator.getRoadId(),
                    excessSpeed,
                    state.exitTimestamp()
            );

            fineCollectionClient.submitForFine(violation);
        }

        return state;
    }
}
