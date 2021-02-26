# Assignment 3 - Add Dapr state management

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The TrafficControl service saves the state of a vehicle (`VehicleState` class) using the state management building block after vehicle entry.
- The TrafficControl service reads, updates and saves the state of a vehicle using the state management building block after vehicle exit.

This is number **3** in the end-state setup:

<img src="../../dapr-traffic-control/img/dapr-setup.png" style="zoom: 67%;" />

For both these tasks you will use the Dapr client for .NET.

## Step 1: Use Dapr state-management building block

1. Open the `src` folder in this repo in VS Code.

2. Open the file `src/TrafficControlService/Controllers/TrafficController.cs` in VS Code.

3. Inspect the code in the `VehicleEntry` method of this controller. It uses an instance of an `IVehicleStateRepository` to store and retrieve vehicle state:

   ```csharp
   // store vehicle state
   var vehicleState = new VehicleState
   {
     LicenseNumber = msg.LicenseNumber,
     EntryTimestamp = msg.Timestamp
   };
   await _vehicleStateRepository.SaveVehicleStateAsync(vehicleState);
   ```

4. Open the file `src/TrafficControlService/Repositories/InMemoryVehicleStateRepository.cs` in VS Code.

5. This is the repository used by the TrafficControlService. Inspect the code in this class. As you can see, this repository uses a very simple in-memory Dictionary to store the state. The license-number of the vehicle is used as the key. You are going to replace this implementation with one that uses Dapr state management.

6. Open a new terminal window in VS Code and change the current folder to `src/TrafficControlService`.

7. Add a reference to the Dapr ASP.NET Core integration library:

   ```console
   dotnet add package Dapr.AspNetCore
   ```

8. Restore all references:

   ```console
   dotnet restore
   ```

9. Create a new file `src/TrafficControlService/Repositories/DaprVehicleStateRepository.cs` in VS Code.

10. Create a new `DaprVehicleStateRepository` class in this file that implements the `IVehicleStateRepository` interface:

   ```csharp
   using System.Threading.Tasks;
   using Dapr.Client;
   using TrafficControlService.Models;
   
   namespace TrafficControlService.Repositories
   {
     public class DaprVehicleStateRepository : IVehicleStateRepository
     {
       public async Task<VehicleState> GetVehicleStateAsync(string licenseNumber)
       {
         throw new NotImplementedException();
       }
   
       public async Task SaveVehicleStateAsync(VehicleState vehicleState)
       {
         throw new NotImplementedException();
       }
     }
   }
   ```

11. Add a private constant field in this file holding the name of the state-store:

    ```csharp
    private const string DAPR_STORE_NAME = "statestore";
    ```

12. Expand the class with a private field named `_daprClient` that holds an instance of a `DaprClient` and a constructor that accepts a `DaprClient` instance as argument and initializes this field:

    ```csharp
    private readonly DaprClient _daprClient;
    
    public DaprVehicleStateRepository(DaprClient daprClient)
    {
      _daprClient = daprClient;
    }
    ```

13. Replace the implementation of the `GetVehicleStateAsync` method with the following code:

    ```csharp
    var stateEntry = await _daprClient.GetStateEntryAsync<VehicleState>(
      DAPR_STORE_NAME, licenseNumber);
    return stateEntry.Value;
    ```

14. Replace the implementation of the `SaveVehicleStateAsync` method with the following code:

    ```csharp
    await _daprClient.SaveStateAsync<VehicleState>(
      DAPR_STORE_NAME, vehicleState.LicenseNumber, vehicleState);
    ```

The repository code should now look like this:

```csharp
using System.Threading.Tasks;
using Dapr.Client;
using TrafficControlService.Models;

namespace TrafficControlService.Repositories
{
  public class DaprVehicleStateRepository : IVehicleStateRepository
  {
    private const string DAPR_STORE_NAME = "statestore";
    private readonly DaprClient _daprClient;

    public DaprVehicleStateRepository(DaprClient daprClient)
    {
      _daprClient = daprClient;
    }
    public async Task<VehicleState> GetVehicleStateAsync(string licenseNumber)
    {
      var stateEntry = await _daprClient.GetStateEntryAsync<VehicleState>(
        DAPR_STORE_NAME, licenseNumber);
      return stateEntry.Value;
    }

    public async Task SaveVehicleStateAsync(VehicleState vehicleState)
    {
      await _daprClient.SaveStateAsync<VehicleState>(
        DAPR_STORE_NAME, vehicleState.LicenseNumber, vehicleState);
    }
  }
}
```

Take some time to inspect the code. As you can see, it is very straightforward to use the Dapr state management building block using the .NET SDK for Dapr.  

Now you need to make sure the repository you created is injected into the `TrafficController`. 

1. Open the file `src/TrafficControlService/Startup.cs`.

1. In the `ConfigureServices` method, the `IVehicleStateRepository` implementation to use is registered with dependency injection:

   ```csharp
   services.AddSingleton<IVehicleStateRepository, InMemoryVehicleRepository>();
   ```

1. Replace the `InMemoryVehicleStateRepository` with your new new `DaprVehicleStateRepository`:

   ```csharp
   services.AddSingleton<IVehicleStateRepository, DaprVehicleRepository>();
   ```

1. The last thing you need to do is make sure the `DaprClient` is registered with dependency injection. Append `.AddDapr();` to the call to `services.AddControllers()`:

   ```csharp
   services.AddControllers().AddDapr();
   ```

1. Open a new terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application.

## Step 2: Test the application

1. Make sure no services from previous tests are running (close the terminal windows).

2. Open a new terminal window in VS Code and change the current folder to `src/VehicleRegistrationService`.

3. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 5002 --dapr-http-port 3502 --dapr-grpc-port 50002 dotnet run
   ```

4. Open a new terminal window in VS Code and change the current folder to `src/FineCollectionService`.

5. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 5001 --dapr-http-port 3501 --dapr-grpc-port 50001 dotnet run
   ```

6. Open a new terminal window in VS Code and change the current folder to `src/TrafficControlService`.

7. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-http-port 3500 --dapr-grpc-port 50000 dotnet run
   ```

8. Open a new terminal window in VS Code and change the current folder to `src/Simulation`.

9. Start the simulation:

   ```
   dotnet run
   ```

You should see similar logging as before.

## Step 2: Verify the state-store

 Obviously, the behavior of the application is exactly the same as before. But are the VehicleState entries actually stored in the default Redis state-store? To check this, you will use the redis CLI inside the `dapr_redis` container that is used as state-store in the default Dapr installation.

1. Open a new command-shell window.

2. Execute the following command to start the redis-cli inside the running `dapr_redis` container:

   ```
   docker exec -it dapr_redis redis-cli
   ```

3. In the redis-cli enter the following command to get the list of keys of items stored in the redis cache:

   ```
   keys *
   ```

   You should see a list of entries with keys in the form `"trafficcontrolservice||<license-number>"`.

4. Enter the following command in the redis-cli to get the data stored with this key (change the license-number to one in the list you see):

   ```
   hgetall trafficcontrolservice||04-TP-59
   ```

5. You should see something similar to this:

   <img src="img/redis-cli.png" />

As you can see, the data is actually stored in the redis cache. The cool thing about Dapr is that multiple components exist that implement the state-management building-block. So without changing any code but only specifying a different Dapr configuration, you could use an entirely different storage mechanism. If you're up for it, try to swap-out redis with another state provider (see the [dapr-documentation on state management](https://github.com/dapr/docs/blob/master/concepts/state-management/README.md)).


## Next assignment

Make sure you stop all running processes before proceeding to the next assignment.

Go to [assignment 4](../Assignment04/README.md).