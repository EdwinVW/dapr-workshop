package dapr.fines.violation;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ViolationController {
    private final ViolationProcessor violationProcessor;

    public ViolationController(final ViolationProcessor violationProcessor) {
        this.violationProcessor = violationProcessor;
    }

    @PostMapping("/collectfine")
    public ResponseEntity<Void> registerViolation(@RequestBody final SpeedingViolation violation) {
        violationProcessor.processSpeedingViolation(violation);
        return ResponseEntity.ok().build();
    }
}
