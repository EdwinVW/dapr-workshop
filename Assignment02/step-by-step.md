# Assignment 2 - Add Dapr service-to-service invocation

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The VehicleRegistrationService and FineCollectionService are running with Dapr.
- The FineCollectionService uses the Dapr client for .NET to call the `/vehicleinfo/{licensenumber}` endpoint on the VehicleRegistrationService using Dapr service invocation.

This is number **1** in the end-state setup:

<img src="../../dapr-traffic-control/img/dapr-setup.png" style="zoom: 67%;" />

### Step 1: Start the VehicleRegistrationService with Dapr

In assignment 1, you started all the services using `dotnet run`. When you want to run a service with a Dapr side-car that handles its communication, you need to start it using the Dapr CLI. There are a couple of things you need to specify when starting the service:

- The service needs a unique id which Dapr can use to find it. This is called the *app-id* (or application Id). You specify this with the `--app-id` flag on the command-line.
- Each of the services listen on a different HTTP port for requests. The VehicleRegistrationService runs on port `5002` for instance. You need to tell Dapr this port so the Dapr sidecar can communicate with the service. You specify this with the `--app-port` flag on the command-line.
- Dapr uses HTTP or gRPC to communicate with the Dapr side-car. The ports used for this communication is `3500` for HTTP and `50001` for gRPC by default. But to prevent port collisions on the local machine when running multiple services, you have to specify a unique HTTP and gRPC port per service. You specify this with the `--dapr-http-port` and `--dapr-grpc-port` flags on the command-line. 
- Finally you need to tell Dapr how to start the service. We are using .NET so we can specify `dotnet run`.

You will use the `run` command of the Dapr CLI and specify all the options above on the command-line:

1. Make sure you have started Docker Desktop on your machine and the Dapr CLI and runtime are installed (see the [prerequisites](../README.md#prerequisites)).

2. Open the `src` folder in this repo in VS Code. 

   > Throughout the assignment you need to execute all steps in the same instance of VS Code. 

3. Open a new terminal window in VS Code and change the current folder to `src/VehicleRegistrationService`.

4. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 5002 --dapr-http-port 3502 --dapr-grpc-port 50002 dotnet run
   ```

5. Check the logs for any errors. As you can see, both Dapr as well as application logging is shown as output.

Now you're running a 'Daprized' version of the VehicleRegistrationService. As you might have noticed, you didn't need to change any code for this to work. The VehicleRegistrationService is still just a web API listening for requests. Only now, you've started it with a Dapr sidecar next to it that can communicate with it. This means other services can use Dapr to call this service. This is what you'll do in the next step.

## Step 2: Call the VehicleRegistrationService using Dapr service invocation

In this step, you're going to change the code of the FineCollectionService so it uses Dapr service invocation to call the VehicleRegistrationService.

First you're going to change the code so it calls the Dapr sidecar:

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Inspect the `CollectFine` method. It contains a call to the VehicleRegistrationService to retrieve the vehicle info:

   ```csharp
   // get owner info
   var vehicleInfo = await _vehicleRegistrationService.GetVehicleInfo(speedingViolation.VehicleId);
   ```

   The `_vehicleRegistrationService` is an instance of a proxy that uses the .NET `HTTPclient` to call the VehicleRegistrationService. You are going to change that proxy so it uses the Dapr sidecar.

1. Open the file `src/FineCollectionService/Proxies/VehicleRegistrationService.cs` in VS Code.

1. Inspect the `GetVehicleInfo` method. You can see that in the HTTP call, the URL of the VehicleRegistrationService (running on port 5002) is used: 

   ```csharp
   public async Task<VehicleInfo> GetVehicleInfo(string licenseNumber)
   {
   	return await _httpClient.GetFromJsonAsync<VehicleInfo>(
   		$"http://localhost:5002/vehicleinfo/{licenseNumber}", _serializerOptions);
   }
   ```

1. The API for calling the Dapr service invocation building block on a Dapr sidecar is: `http://localhost:<daprPort>/v1.0/invoke/<appId>/method/<method-name>`.  When we substitute the placeholders in this URL with values for our situation, this yields the following URL: `http://localhost:3501/v1.0/invoke/vehicleregistrationservice/method/vehicleinfo/{licenseNumber}`. As you can see in this URL, we will be running the sidecar for the FineCollectionService on HTTP port `3501`. 

1. Replace the URL in the code with the new Dapr service invocation URL. The code should now look like this:

   ```csharp
   public async Task<VehicleInfo> GetVehicleInfo(string licenseNumber)
   {
   	return await _httpClient.GetFromJsonAsync<VehicleInfo>(
   		$"http://localhost:3501/v1.0/invoke/vehicleregistrationservice/method/vehicleinfo/{licenseNumber}", 
   		_serializerOptions);
   }
   ```
   
   > It's important to really grasp this sidecar pattern. In this case, the FineCollectionService calls the VehicleRegistrationService by **calling its own dapr sidecar**! The FineCollectionService doesn't need to know anymore where the VehicleRegistrationService lives because its Dapr sidecar will take care of that. It will find it based on the `app-id` specified in the URL and call the target service's sidecar.
   
1. Open a new terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code:

   ```
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 5001 --dapr-http-port 3501 --dapr-grpc-port 50001 dotnet run
   ```

1. Check the logs for any errors. As you can see, both Dapr as well as application logging is shown as output.

Now you're going to test the application:

1. Open a new terminal window in VS Code and change the current folder to `src/TrafficControlService`.

1. Enter the following command to run the TrafficControlService:

1. ```console
   dotnet run
   ```

> The TrafficControlService does not need to run with a Dapr sidecar in this assignment. This is because it will still call the FineCollectionService over HTTP as before.

The services are up & running. Now you're going to test this using the simulation.

1. Open a new terminal window in VS Code and change the current folder to `src/Simulation`.

1. Start the simulation:

   ```
   dotnet run
   ```

You should see similar logging as before when you ran the application. So all the functionality works the same, but now you use Dapr service invocation to communicate between the FineCollectionService and the VehicleRegistrationService. 

## Step 3: Use Dapr service invocation with the Dapr SDK for .NET

In this step, you're going to change the code of the FineCollectionService so it uses the .NET `DaprClient` to call the VehicleRegistrationService.

First stop the simulation:

1. Open to the command-shell window in which the Camera Simulation runs.

1. Stop de simulation by pressing `Ctrl-C` and close the command-shell by clicking the trashcan icon in its title bar (or typing the `exit` command).

1. Open to the command-shell window in which the FineCollectionService runs.

1. Stop de service by pressing `Ctrl-C`. Keep this terminal window open and focused.

1. Add a reference to the Dapr ASP.NET Core integration library:

	```console
   dotnet add package Dapr.AspNetCore
   ```
   > In this case we're using the Dapr ASP.NET Core integration package. This contains the Dapr client, but also some classes that make integration with ASP.NET Core very easy. And because the services are all ASP.NET Core WebAPIs, we'll use this package throughout the workshop.

1. Restore all references:

   ```console
   dotnet restore
   ```

Now change the code so it uses Dapr client to make the call to the VehicleRegistrationService:

1. Open the file `src/FineCollectionService/Startup.cs` in VS Code.

1. Add a using statement in this file to make sure you can use the Dapr client:

   ```csharp
   using Dapr.Client;
   ```
   
1. The `ConfigureServices` method, contains these two lines of code which register the .NET `HttpClient` and the `VehicleRegistrationService`  proxy (which uses the `HttpClient`) in dependency injection:

   ```csharp
   // add service proxies
   services.AddHttpClient();
   services.AddSingleton<VehicleRegistrationService>();
   ```

1. Replace these two lines with with the following line"

   ```csharp
   // add service proxies
   services.AddSingleton<VehicleRegistrationService>(_ => 
   	new VehicleRegistrationService(DaprClient.CreateInvokeHttpClient("vehicleregistrationservice")));
   ```

   As you can see in this snippet, you use the `DaprClient` to create an `HttpClient` instance for doing service invocation. You specify the `app-id` of the service you want to communicate with. This `HttpClient` instance is passed into the constructor of the `VehicleRegistrationService` proxy.

1. Open the file `src/FineCollectionService/Proxies/VehicleRegistrationService.cs` in VS Code.

1. Because the `HttpClient` passed into this class has already been created for a certain `app-id`, you can omit the host information from the request URL. Change the URL that is used in the `GetVehicleInfo` to `/vehicleinfo/{license-number}`. The method should now look like this:

   ```csharp
   public async Task<VehicleInfo> GetVehicleInfo(string licenseNumber)
   {
   	return await _httpClient.GetFromJsonAsync<VehicleInfo>(
   		$"/vehicleinfo/{licenseNumber}", _serializerOptions);
   }
   ```

Now the FineCollectionService is changed to use the .NET SDK for Dapr. Let's test this.

1. Make sure the VehicleRegistrationService is still running (see step 1 of this assignment).

1. Open a new terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 5001 --dapr-http-port 3501 --dapr-grpc-port 50001 dotnet run
   ```

1. Open a new terminal window in VS Code and change the current folder to `src/TrafficControlService`.

1. Enter the following command to run the TrafficControlService:

1. ```console
   dotnet run
   ```

> The TrafficControlService does not need to run with a Dapr sidecar in this assignment. This is because it will still call the FineCollectionService over HTTP as before.

The services are up & running. Now you're going to test this using the simulation.

1. Open a new terminal window in VS Code and change the current folder to `src/Simulation`.

1. Start the simulation:

   ```
   dotnet run
   ```

You should see similar logging as before when you ran the application. 

## Step 4: Use Dapr observability

So how can you check whether or not the call to the VehicleRegistrationService is handled by Dapr? Well, Dapr has some observability built in. You can look at Dapr traffic using Zipkin:

1. Open a browser and go the this URL: [http://localhost:9411/zipkin](http://localhost:9411/zipkin).

2. Click the `RUN QUERY` button in the top right of the screen to search for traces.

3. You should see the calls between the FineCollectionService and the VehicleRegistrationService. You can expand and collapse each trace and click the `SHOW` button to get more details:

   ![](img/zipkin-traces.png)

4. If you click the dependencies button and search, you will see the services and the traffic flowing between them:

   ![](img/zipkin-dependencies.gif)

## Next assignment

Make sure you stop all running processes before proceeding to the next assignment.

Go to [assignment 3](../Assignment03/README.md).