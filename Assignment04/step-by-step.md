# Assignment 4 - Add Dapr state management

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControl service saves the state of a vehicle (`VehicleState` class) using the state management building block after vehicle entry.
- The TrafficControl service reads and updates the state of a vehicle using the state management building block after vehicle exit.

This assignment targets number **3** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Use the Dapr state management building block

First, you need to add something to the state management configuration file:

1. Open the file `dapr/components/statestore.yaml` in VS Code.

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

1. Open the file `TrafficControlService/Controllers/TrafficController.cs` in VS Code.

1. Inspect the code in the `VehicleEntry` method of this controller. It uses `_vehicleStateRepository` (an injected implementation of the `IVehicleStateRepository` interface) to store vehicle state:

   ```csharp
   // store vehicle state
   var vehicleState = new VehicleState
   {
       LicenseNumber = msg.LicenseNumber,
       EntryTimestamp = msg.Timestamp
   };
   await _vehicleStateRepository.SaveVehicleStateAsync(vehicleState);
   ```

1. Open the file `TrafficControlService/Repositories/InMemoryVehicleStateRepository.cs` in VS Code.

1. This is the repository used by the TrafficControlService. Inspect the code in this class. Inspect the code of this repository. As you can see, this repository uses a very simple in-memory dictionary to store the state. The license number of the vehicle is used as the key. You are going to replace this implementation with one that uses Dapr state management.

1. Create a new file `TrafficControlService/Repositories/DaprVehicleStateRepository.cs` in VS Code.

1. Create a new `DaprVehicleStateRepository` class in this file that implements the `IVehicleStateRepository` interface. Use this snippet to get started:

    ```csharp
    namespace TrafficControlService.Repositories;
    
    public class DaprVehicleStateRepository : IVehicleStateRepository
    {
        private const string DAPR_STORE_NAME = "statestore";
    
        public async Task<VehicleState?> GetVehicleStateAsync(string licenseNumber)
        {
            throw new NotImplementedException();
        }
    
        public async Task SaveVehicleStateAsync(VehicleState vehicleState)
        {
            throw new NotImplementedException();
        }
    }
    ```

1. Add a private field to the class named `_httpClient` that holds an instance of a `HttpClient` and a constructor that accepts a `HttpClient` instance as argument and initializes this field:

    ```csharp
    private readonly HttpClient _httpClient;
    
    public DaprVehicleStateRepository(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }
    ```

1. The URL for saving data using the Dapr state API is: `http://localhost:<daprPort>/v1.0/state/<statestore-name>`. You'll use this API to store the VehicleState. Replace the implementation of the `SaveVehicleStateAsync` method with the following code:

   ```csharp
   var state = new[]
   {
       new 
       { 
           key = vehicleState.LicenseNumber,
           value = vehicleState
       }
   };
   
   await _httpClient.PostAsJsonAsync(
       $"http://localhost:3600/v1.0/state/{DAPR_STORE_NAME}",
       state);
   ```

    > As you can see here, the structure of the data when saving state is an array of key/value pairs. In this example you use an anonymous type as payload.

1. The URL for getting data using the Dapr state API is: `http://localhost:<daprPort>/v1.0/state/<statestore-name>/<key>`. You'll use this API to retrieve the VehicleState. Replace the implementation of the `GetVehicleStateAsync` method with the following code:

    ```csharp
    var state = await _httpClient.GetFromJsonAsync<VehicleState>(
        $"http://localhost:3600/v1.0/state/{DAPR_STORE_NAME}/{licenseNumber}");
    return state;
    ```

The repository code should now look like this:

```csharp
namespace TrafficControlService.Repositories;

public class DaprVehicleStateRepository : IVehicleStateRepository
{
    private const string DAPR_STORE_NAME = "statestore";

    private readonly HttpClient _httpClient;

    public DaprVehicleStateRepository(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<VehicleState?> GetVehicleStateAsync(string licenseNumber)
    {
        var state = await _httpClient.GetFromJsonAsync<VehicleState>(
            $"http://localhost:3600/v1.0/state/{DAPR_STORE_NAME}/{licenseNumber}");
        return state;
    }

    public async Task SaveVehicleStateAsync(VehicleState vehicleState)
    {
        var state = new[]
        {
            new 
            {
                key = vehicleState.LicenseNumber,
                value = vehicleState
            }
        };

        await _httpClient.PostAsJsonAsync(
            $"http://localhost:3600/v1.0/state/{DAPR_STORE_NAME}",
            state);
    }
}
```

Now you need to make sure your new repository is registered with dependency-injection.

1. Open the file `TrafficControlService/Program.cs`.

1. In this filer, the `IVehicleStateRepository` implementation to use is registered with dependency injection:

   ```csharp
   builder.Services.AddSingleton<IVehicleStateRepository, InMemoryVehicleStateRepository>();
   ```

1. Replace the `InMemoryVehicleStateRepository` with your new new `DaprVehicleStateRepository`:

   ```csharp
   builder.Services.AddSingleton<IVehicleStateRepository, DaprVehicleStateRepository>();
   ```

1. Open the terminal window in VS Code and make sure the current folder is `TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application.

## Step 2a: Test the application

1. Make sure no services from previous tests are running (close the terminal windows)

1. Make sure all the Docker containers introduced in the previous assignments are running (you can use the `Infrastructure/start-all.ps1` script to start them).

1. Open the terminal window in VS Code and make sure the current folder is `VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `Simulation`.

1. Start the simulation:

   ```console
   dotnet run
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

   ```console
   ❯ docker exec -it dapr_redis redis-cli
   127.0.0.1:6379> keys *
    1) "trafficcontrolservice||18-RSS-4"
    2) "trafficcontrolservice||84-GJ-06"
    3) "trafficcontrolservice||KJ-HS-06"
    4) "trafficcontrolservice||JN-TH-23"
    5) "trafficcontrolservice||11-GT-84"
    6) "trafficcontrolservice||RN-KR-35"
    7) "trafficcontrolservice||10-HYD-5"
    8) "trafficcontrolservice||YT-66-PY"
    9) "trafficcontrolservice||ND-841-Y"
   10) "trafficcontrolservice||T-375-NF"
   127.0.0.1:6379> hgetall trafficcontrolservice||ND-841-Y
   1) "version"
   2) "1"
   3) "data"
   4) "{\"licenseNumber\":\"ND-841-Y\",\"entryTimestamp\":\"2021-09-15T11:19:18.1781609+02:00\",\"exitTimestamp\":\"0001-01-01T00:00:00\"}"
   ```

As you can see, the data is actually stored in the redis cache. The cool thing about Dapr is that the state management building block supports different state-stores through its component model. So without changing any code but only specifying a different Dapr component configuration, you could use an entirely different storage mechanism.

> If you're up for it, try to swap-out Redis with another state provider. See the [the list of available stores in the Dapr documentation](https://docs.dapr.io/operations/components/setup-state-store/supported-state-stores/)). To configure a different state-store, you need to change the file `dapr/components/statestore.yaml`.

## Step 3: Use Dapr state management with the Dapr SDK for .NET

In this step you're going to change the `DaprVehicleStateRepository` and replace calling the Dapr state management API directly over HTTP with using the `DaprClient` from the Dapr SDK for .NET.

1. Open the file `TrafficControlService/Repositories/DaprVehicleStateRepository.cs` in VS Code.

1. Change all occurrences of the `HttpClient` with `DaprClient` and rename the private field `_httpClient` to `_daprClient`.

1. Replace the implementation of the `GetVehicleStateAsync` method with the following code:

   ```csharp
   return await _daprClient.GetStateAsync<VehicleState>(
       DAPR_STORE_NAME, licenseNumber);
   ```

1. Replace the implementation of the `SaveVehicleStateAsync` method with the following code:

   ```csharp
   await _daprClient.SaveStateAsync(
       DAPR_STORE_NAME, vehicleState.LicenseNumber, vehicleState);
   ```

1. The repository code should now look like this:

   ```csharp
   namespace TrafficControlService.Repositories;
   
   public class DaprVehicleStateRepository : IVehicleStateRepository
   {
       private const string DAPR_STORE_NAME = "statestore";
   
       private readonly DaprClient _daprClient;
   
       public DaprVehicleStateRepository(DaprClient daprClient)
       {
           _daprClient = daprClient;
       }
   
       public async Task<VehicleState?> GetVehicleStateAsync(string licenseNumber)
       {
           return await _daprClient.GetStateAsync<VehicleState>(
               DAPR_STORE_NAME, licenseNumber);
       }
   
       public async Task SaveVehicleStateAsync(VehicleState vehicleState)
       {
           await _daprClient.SaveStateAsync(
               DAPR_STORE_NAME, vehicleState.LicenseNumber, vehicleState);
       }
   }
   ```

1. Open the terminal window in VS Code and make sure the current folder is `TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application. Just repeat steps 2a and 2b.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 5](../Assignment05/README.md).
