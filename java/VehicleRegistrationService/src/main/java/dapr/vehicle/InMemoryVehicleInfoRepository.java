package dapr.vehicle;

import org.ajbrown.namemachine.NameGenerator;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Map;
import java.util.Random;

@Component
public class InMemoryVehicleInfoRepository implements VehicleInfoRepository {
    private final Random random = new SecureRandom();

    private final String[] vehicleMakes = new String[] {
            "Mercedes", "Toyota", "Audi", "Volkswagen", "Seat", "Renault", "Skoda",
            "Kia", "Citroën", "Suzuki", "Mitsubishi", "Fiat", "Opel"
    };

    private final Map<String, String[]> modelsByMake = Map.ofEntries(
        Map.entry("Mercedes", new String[] { "A Class", "B Class", "C Class", "E Class", "SLS", "SLK" }),
        Map.entry("Toyota", new String[] { "Yaris", "Avensis", "Rav 4", "Prius", "Celica" }),
        Map.entry("Audi", new String[] { "A3", "A4", "A6", "A8", "Q5", "Q7" }),
        Map.entry("Volkswagen", new String[] { "Golf", "Pasat", "Tiguan", "Caddy" }),
        Map.entry("Seat", new String[] { "Leon", "Arona", "Ibiza", "Alhambra" }),
        Map.entry("Renault", new String[] { "Megane", "Clio", "Twingo", "Scenic", "Captur" }),
        Map.entry("Skoda", new String[] { "Octavia", "Fabia", "Superb", "Karoq", "Kodiaq" }),
        Map.entry("Kia", new String[] { "Picanto", "Rio", "Ceed", "XCeed", "Niro", "Sportage" }),
        Map.entry("Citroën", new String[] { "C1", "C2", "C3", "C4", "C4 Cactus", "Berlingo" }),
        Map.entry("Suzuki", new String[] { "Ignis", "Swift", "Vitara", "S-Cross", "Swace", "Jimny" }),
        Map.entry("Mitsubishi", new String[] { "Space Star", "ASX", "Eclipse Cross", "Outlander PHEV" }),
        Map.entry("Ford", new String[] { "Focus", "Ka", "C-Max", "Fusion", "Fiesta", "Mondeo", "Kuga" }),
        Map.entry("BMW", new String[] { "1 Serie", "2 Serie", "3 Serie", "5 Serie", "7 Serie", "X5" }),
        Map.entry("Fiat", new String[] { "500", "Panda", "Punto", "Tipo", "Multipla" }),
        Map.entry("Opel", new String[] { "Karl", "Corsa", "Astra", "Crossland X", "Insignia" })
    );

    private final NameGenerator nameGenerator = new NameGenerator();

    @Override
    public VehicleInfo getVehicleInfo(final String licenseNumber) {
        var make = selectRandom(vehicleMakes);
        var model = selectRandom(modelsByMake.get(make));
        var name = nameGenerator.generateNames(1).get(0).toString();
        var email = name.toLowerCase().replace(' ', '.') + "@gmail.com";

        return new VehicleInfo(
                licenseNumber,
                make,
                model,
                name,
                email
        );
    }

    private String selectRandom(final String[] options) {
        var idx = random.nextInt(options.length);
        return options[idx];
    }
}
