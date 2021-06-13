package dapr.fines.violation;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@Slf4j
public class ViolationController {
    private final ViolationProcessor violationProcessor;

    @PostMapping("/collectfine")
    public ResponseEntity<Void> registerViolation(@RequestBody final SpeedingViolation violation) {
        violationProcessor.processSpeedingViolation(violation);
        return ResponseEntity.ok().build();
    }
}
