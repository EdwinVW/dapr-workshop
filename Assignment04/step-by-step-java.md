# Assignment 4 - Add Dapr state management

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControl service saves the state of a vehicle (`VehicleState` class) using the state management building block after vehicle entry.
- The TrafficControl service reads and updates the state of a vehicle using the state management building block after vehicle exit.

This assignment targets number **3** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Use the Dapr state management building block

First, you need to add something to the state management configuration file:

1. Open the file `src/dapr/components/statestore.yaml` in VS Code.

1. Add a `scopes` section to the configuration file that specifies that only the TrafficControlService should use the state management building block:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: statestore
   spec:
     type: state.redis
     version: v1
     metadata:
     - name: redisHost
       value: localhost:6379
     - name: redisPassword
       value: ""
     - name: actorStateStore
       value: "true"
   scopes:
     - trafficcontrolservice
   ```

Now you will add code to the TrafficControlService so it uses the Dapr state management building block to store vehicle state:

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/TrafficController.java` in VS Code.

1. Inspect the code in the `vehicleEntry` and `vehicleExit` methods of this controller. It uses `vehicleStateRepository` (an injected implementation of the `VehicleStateRepository` interface) to store vehicle state:

   ```java
   var state = new VehicleState(request.licenseNumber(), request.timestamp());
   vehicleStateRepository.saveVehicleState(state);
   ```

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/vehicle/InMemoryVehicleStateRepository.java` in VS Code. 

1. This is the repository used by the TrafficControlService. Inspect the code of this repository. As you can see, this repository uses a very simple in-memory key/value map to store the state. The license number of the vehicle is used as the key. You are going to replace this implementation with one that uses Dapr state management.

1. Create a new file `src-java/TrafficControlService/src/main/java/dapr/traffic/vehicle/DaprVehicleStateRepository.java` in VS Code.

1. Create a new `DaprVehicleStateRepository` class in this file that implements the `VehicleStateRepository` interface. Use this snippet to get started:

    ```java
    package dapr.traffic.vehicle;

    import org.springframework.web.client.RestTemplate;

    import java.util.Optional;

    public class DaprVehicleStateRepository implements VehicleStateRepository {
        @Override
        public VehicleState saveVehicleState(VehicleState vehicleState) {
            return null;
        }

        @Override
        public Optional<VehicleState> getVehicleState(String licenseNumber) {
            return Optional.empty();
        }
    }
    ```

1. Add an instance field to the class named `restTemplate` that holds an instance of a `RestTemplate` and a constructor that accepts a `RestTemplate` instance as argument and initializes this field:

    ```java
    private final RestTemplate restTemplate;

    public DaprVehicleStateRepository(final RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    ```

1. The URL for saving data using the Dapr state API is: `http://localhost:<daprPort>/v1.0/state/<statestore-name>`. You'll use this API to store the VehicleState. Add these two constants to the class:

   ```java
    private static final String DAPR_STORE_NAME = "statestore";
    private static final String DAPR_BASE_URL = "http://localhost:3600/v1.0/state/" + DAPR_STORE_NAME;
   ```

1. Add this inner class:

   ```java
   private static class DaprStateEntry {
       private final String key;
       private final VehicleState value;

       public DaprStateEntry(final String key, final VehicleState value) {
           this.key = key;
           this.value = value;
       }

       public String getKey() {
           return this.key;
       }

       public VehicleState getValue() {
           return this.value;
       }
   }
   ```

1. Now replace the implementation of the `saveVehicleState` method with the following code:

   ```java
   public VehicleState saveVehicleState(VehicleState vehicleState) {
       var entries = new DaprStateEntry[] {
               new DaprStateEntry(vehicleState.licenseNumber(), vehicleState)
       };

       restTemplate.postForEntity(DAPR_BASE_URL, entries, Object.class);

       return vehicleState;
   }
   ```

   This may look like a lot of code, but don't worry, we will soon replace that with clever use of the Dapr SDK for Java.

    > As you can see here, the structure of the data when saving state is an array of key/value pairs. In this example you use the newly created `DaprStateEntry` class as a data-transfer object for the Dapr State management API.

1. The URL for getting data using the Dapr state API is: `http://localhost:<daprPort>/v1.0/state/<statestore-name>/<key>`. You'll use this API to retrieve the VehicleState. Replace the implementation of the `getVehicleState` method with the following code:

    ```java
    var state = restTemplate.getForObject(DAPR_BASE_URL + "/" + licenseNumber, VehicleState.class);

    return Optional.ofNullable(state);
    ```

The repository code should now look like this:

```java
package dapr.traffic.vehicle;

import org.springframework.web.client.RestTemplate;

import java.util.Optional;

public class DaprVehicleStateRepository implements VehicleStateRepository {
    private static final String DAPR_STORE_NAME = "statestore";
    private static final String DAPR_BASE_URL = "http://localhost:3600/v1.0/state/" + DAPR_STORE_NAME;

    private static class DaprStateEntry {
        private final String key;
        private final VehicleState value;

        public DaprStateEntry(final String key, final VehicleState value) {
            this.key = key;
            this.value = value;
        }

        public String getKey() {
            return this.key;
        }

        public VehicleState getValue() {
            return this.value;
        }
    }

    private final RestTemplate restTemplate;

    public DaprVehicleStateRepository(final RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Override
    public VehicleState saveVehicleState(VehicleState vehicleState) {
        var entries = new DaprStateEntry[] {
                new DaprStateEntry(vehicleState.licenseNumber(), vehicleState)
        };

        restTemplate.postForEntity(DAPR_BASE_URL, entries, Object.class);

        return vehicleState;
    }

    @Override
    public Optional<VehicleState> getVehicleState(String licenseNumber) {
        var state = restTemplate.getForObject(DAPR_BASE_URL + "/" + licenseNumber, VehicleState.class);

        return Optional.ofNullable(state);
    }
}
```

Now you need to make sure Spring will use the Dapr-based repository rather than the in-memory one.

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/TrafficControlConfiguration.java`.

1. Replace the `vehicleStateRepository` method with the following:

  ```java
  @Bean
  public VehicleStateRepository vehicleStateRepository(final RestTemplate restTemplate) {
      return new DaprVehicleStateRepository(restTemplate);
  }
  ```

1. Open the terminal window in VS Code and make sure the current folder is `src-java/TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application.

## Step 2a: Test the application

1. Make sure no services from previous tests are running (close the terminal windows)

1. Make sure all the Docker containers introduced in the previous assignments are running (you can use the `src-java/Infrastructure/start-all.sh` script to start them).

1. Open the terminal window in VS Code and make sure the current folder is `src-java/VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components mvn spring-boot:run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src-java/FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components mvn spring-boot:run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src-java/TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components mvn spring-boot:run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src-java/Simulation`.

1. Start the simulation:

   ```console
   mvn spring-boot:run
   ```

You should see similar logging as before.

## Step 2b: Verify the state-store

Obviously, the behavior of the application is exactly the same as before. But are the VehicleState entries actually stored in the default Redis state-store? To check this, you will use the redis CLI inside the `dapr_redis` container that is used as state-store in the default Dapr installation.

1. Open a **new** terminal window in VS Code.

1. Execute the following command to start the redis-cli inside the running `dapr_redis` container:

   ```console
   docker exec -it dapr_redis redis-cli
   ```

1. In the redis-cli enter the following command to get the list of keys of items stored in the redis cache:

   ```console
   keys *
   ```

   You should see a list of entries with keys in the form `"trafficcontrolservice||<license-number>"`.

1. Enter the following command in the redis-cli to get the data stored with this key (change the license-number to one in the list you see):

   ```console
   hgetall trafficcontrolservice||KL-495-J
   ```

1. You should see something similar to this:

   ![CLI output](img/redis-cli.png)

As you can see, the data is actually stored in the redis cache. The cool thing about Dapr is that the state management building block supports different state-stores through its component model. So without changing any code but only specifying a different Dapr component configuration, you could use an entirely different storage mechanism.

> If you're up for it, try to swap-out Redis with another state provider. See the [the list of available stores in the Dapr documentation](https://docs.dapr.io/operations/components/setup-state-store/supported-state-stores/)). To configure a different state-store, you need to change the file `src-java/dapr/components/statestore.yaml`.

## Step 3: Use Dapr state management with the Dapr SDK for Java

In this step you're going to change the `DaprVehicleStateRepository` and replace calling the Dapr state management API directly over HTTP with using the `DaprClient` from the Dapr SDK for Java.

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/vehicle/DaprVehicleStateRepository.java` in VS Code.

1. Add an import statement for the Dapr client:

   ```java
   import io.dapr.client.DaprClient;
   ```
   
1. Replace the `RestTemplate` instance variable with a different name and different type. Also replace the constructor:

   ```java
   private DaprClient daprClient;

   public DaprVehicleStateRepository(final DaprClient daprClient) {
       this.daprClient = daprClient;
   }
   ```

1. Replace the implementation of the `getVehicleState` method with the following code:

   ```java
   return daprClient.getState(DAPR_STORE_NAME, licenseNumber, VehicleState.class)
           .blockOptional()
           .map(State::getValue);
   ```

1. Replace the implementation of the `saveVehicleState` method with the following code:

   ```java
   @Override
   public VehicleState saveVehicleState(VehicleState vehicleState) {
       daprClient.saveState(DAPR_STORE_NAME, vehicleState.licenseNumber(), vehicleState)
               .block();

       return vehicleState;
   }
   ```

1. Remove the `DAPR_BASE_URL` constant as well as the `DaprStateEntry` inner class. Also remove the import for the `RestTemplate` class.

1. The repository code should now look like this:

   ```java
   package dapr.traffic.vehicle;

   import io.dapr.client.domain.State;
   import io.dapr.client.DaprClient;

   import java.util.Optional;

   public class DaprVehicleStateRepository implements VehicleStateRepository {
       private static final String DAPR_STORE_NAME = "statestore";

       private final DaprClient daprClient;

       public DaprVehicleStateRepository(final DaprClient daprClient) {
           this.daprClient = daprClient;
       }

       @Override
       public VehicleState saveVehicleState(VehicleState vehicleState) {
           daprClient.saveState(DAPR_STORE_NAME, vehicleState.licenseNumber(), vehicleState)
                   .block();

           return vehicleState;
       }

       @Override
       public Optional<VehicleState> getVehicleState(String licenseNumber) {
           return daprClient.getState(DAPR_STORE_NAME, licenseNumber, VehicleState.class)
                   .blockOptional()
                   .map(State::getValue);
       }
   }
   ```

1. Open the terminal window in VS Code and make sure the current folder is `src-java/TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application. Just repeat steps 2a and 2b.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 5](../Assignment05/README.md).
