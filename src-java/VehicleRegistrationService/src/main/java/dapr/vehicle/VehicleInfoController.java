package dapr.vehicle;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@AllArgsConstructor
@RestController
@Slf4j
public class VehicleInfoController {
    private final VehicleInfoRepository vehicleInfoRepository;

    @GetMapping("/vehicleinfo/{licenseNumber}")
    public ResponseEntity<VehicleInfo> getVehicleInformation(@PathVariable("licenseNumber") final String licenseNumber) {
        log.info("Retrieving vehicle-info for license number {}", licenseNumber);
        var info = vehicleInfoRepository.getVehicleInfo(licenseNumber);
        return ResponseEntity.ok(info);
    }
}
