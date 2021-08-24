package dapr.simulation;

import dapr.simulation.events.VehicleRegistered;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

@Component
public class Simulation implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(Simulation.class);

    private final ExecutorService executorService;
    private final Random random;
    private final SimulationSettings simulationSettings;
    private final TrafficControlService trafficControlService;

    public Simulation(final ExecutorService executorService,
                      final SimulationSettings simulationSettings,
                      final TrafficControlService trafficControlService) {
        this.executorService = executorService;
        this.random = new SecureRandom();
        this.simulationSettings = simulationSettings;
        this.trafficControlService = trafficControlService;
    }

    @Override
    public void run(final String... args) {
        var numLanes = simulationSettings.getNumLanes();
        IntStream.range(0, numLanes).forEach(lane -> executorService.submit(() -> {
            try {
                this.start(lane, numLanes);
            } catch (InterruptedException ie) {
                log.info("Simulation {} was interrupted", lane);
            }
        }));
    }

    void start(final int entryLane, final int numLanes) throws InterruptedException {
        log.info("Start camera simulation for lane {}", entryLane);
        var entryDelay = simulationSettings.getEntryDelay();
        var exitDelay = simulationSettings.getExitDelay();

        while (true) {
            TimeUnit.MILLISECONDS.sleep(randomNumberBetween(entryDelay.getMinimum(), entryDelay.getMaximum()));

            var licenseNumber = generateRandomLicenseNumber();
            var entry = new VehicleRegistered(entryLane, licenseNumber, LocalDateTime.now());
            log.info("Simulated ENTRY of vehicle with license number {} in lane {}", licenseNumber, entryLane);
            trafficControlService.sendVehicleEntry(entry);

            TimeUnit.SECONDS.sleep(randomNumberBetween(exitDelay.getMinimum(), exitDelay.getMaximum()));
            var exitLane = random.nextInt(numLanes);
            var exit = new VehicleRegistered(exitLane, licenseNumber, LocalDateTime.now());
            trafficControlService.sendVehicleExit(exit);
            log.info("Simulated  EXIT of vehicle with license number {} in lane {}", licenseNumber, exitLane);
        }
    }

    /**
     * Generate a pseudo-random number (just like {@link Random#nextInt(int)} does) that lies between
     * a lower limit (inclusive) and an upper limit (exclusive).
     */
    private int randomNumberBetween(int lower, int upper) {
        return random.nextInt(upper + 1 - lower) + lower;
    }

    private String generateRandomLicenseNumber() {
        var type = 1 + random.nextInt(8);
        return switch (type) {
            case 1 -> // 99-AA-99
                String.format("%02d-%s-%02d", doubleNumber(), randomCharacters(2), doubleNumber());
            case 2 -> // AA-99-AA
                String.format("%s-%02d-%s", randomCharacters(2), doubleNumber(), randomCharacters(2));
            case 3 -> // AA-AA-99
                String.format("%s-%s-%02d", randomCharacters(2), randomCharacters(2), doubleNumber());
            case 4 -> // 99-AA-AA
                String.format("%02d-%s-%s", doubleNumber(), randomCharacters(2), randomCharacters(2));
            case 5 -> // 99-AAA-9
                String.format("%02d-%s-%01d", doubleNumber(), randomCharacters(3), singleNumber());
            case 6 -> // 9-AAA-99
                String.format("%01d-%s-%01d", singleNumber(), randomCharacters(3), singleNumber());
            case 7 -> // AA-999-A
                String.format("%s-%03d-%s", randomCharacters(2), tripleNumber(), randomCharacters(1));
            case 8 ->// A-999-AA
                String.format("%s-%03d-%s", randomCharacters(1), tripleNumber(), randomCharacters(2));
            default -> throw new IllegalStateException("Unexpected type of licence number requested: " + type);
        };
    }

    private int singleNumber() {
        return 1 + random.nextInt(9);
    }

    private int doubleNumber() {
        return 1 + random.nextInt(99);
    }

    private int tripleNumber() {
        return 1 + random.nextInt(999);
    }

    private static final String VALID_LICENCE_NUMBER_CHARS = "DFGHJKLNPRSTXYZ";

    private String randomCharacters(int count) {
        return IntStream.range(0, count)
                .map(i -> random.nextInt(VALID_LICENCE_NUMBER_CHARS.length()))
                .mapToObj(VALID_LICENCE_NUMBER_CHARS::charAt)
                .collect(StringBuilder::new, StringBuilder::append, StringBuilder::append)
                .toString();
    }

}
