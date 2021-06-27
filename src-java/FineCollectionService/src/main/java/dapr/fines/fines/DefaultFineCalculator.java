package dapr.fines.fines;

import finefines.FineFines;

public class DefaultFineCalculator implements FineCalculator {
    private final String fineCalculatorLicenseKey;

    public DefaultFineCalculator(final String fineCalculatorLicenseKey) {
        if (fineCalculatorLicenseKey == null) {
            throw new IllegalArgumentException("fineCalculatorLicenseKey");
        }
        this.fineCalculatorLicenseKey = fineCalculatorLicenseKey;
    }

    private final FineFines fineFines = new FineFines();

    @Override
    public int calculateFine(final int excessSpeed) {
        return fineFines.calculateFine(this.fineCalculatorLicenseKey, excessSpeed);
    }
}
