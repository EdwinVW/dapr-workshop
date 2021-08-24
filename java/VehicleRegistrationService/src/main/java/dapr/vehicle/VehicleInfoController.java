package dapr.vehicle;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VehicleInfoController {
    private static final Logger log = LoggerFactory.getLogger(VehicleInfoController.class);

    private final VehicleInfoRepository vehicleInfoRepository;

    public VehicleInfoController(final VehicleInfoRepository vehicleInfoRepository) {
        this.vehicleInfoRepository = vehicleInfoRepository;
    }

    @GetMapping("/vehicleinfo/{licenseNumber}")
    public ResponseEntity<VehicleInfo> getVehicleInformation(@PathVariable("licenseNumber") final String licenseNumber) {
        log.info("Retrieving vehicle-info for license number {}", licenseNumber);
        var info = vehicleInfoRepository.getVehicleInfo(licenseNumber);
        return ResponseEntity.ok(info);
    }
}
