package finefines;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Properties;

@Slf4j
public class FineFines {
    private final String expectedLicenseKey;

    public FineFines() {
        try (var stream = getClass().getResourceAsStream("/finefines/key.properties")) {
            var properties = new Properties();
            properties.load(stream);
            this.expectedLicenseKey = properties.getProperty("finefines.licenseKey");
        } catch (final IOException ioe) {
            log.error("Can't determine FineFines license key: {}", ioe.getLocalizedMessage());
            throw new IllegalStateException("Can't determine FineFines license key");
        }
    }

    public int calculateFine(final String licenseKey, final int excessSpeed) {
        if (!expectedLicenseKey.equals(licenseKey)) {
            throw new IllegalArgumentException("No valid license key supplied");
        }

        int fine = 9; // default administration charges
        if (excessSpeed < 5) {
            fine += 18;
        } else if (excessSpeed < 10) {
            fine += 31;
        } else if (excessSpeed < 15) {
            fine += 64;
        } else if (excessSpeed < 20) {
            fine += 121;
        } else if (excessSpeed < 25) {
            fine += 174;
        } else if (excessSpeed < 30) {
            fine += 232;
        } else if (excessSpeed < 35) {
            fine += 297;
        } else if (excessSpeed == 35) {
            fine += 372;
        } else {
            // violation above 35 km/h will be determined by the prosecutor
            return -1;
        }

        return fine;
    }
}
