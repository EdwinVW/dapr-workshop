package dapr.fines.fines;

import finefines.FineFines;
import lombok.AllArgsConstructor;
import lombok.NonNull;
import lombok.extern.slf4j.Slf4j;

@AllArgsConstructor
@Slf4j
public class DefaultFineCalculator implements FineCalculator {
    @NonNull
    private final String fineCalculatorLicenseKey;

    private final FineFines fineFines = new FineFines();

    @Override
    public int calculateFine(final int excessSpeed) {
        return fineFines.calculateFine(this.fineCalculatorLicenseKey, excessSpeed);
    }
}
