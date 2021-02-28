# Assignment 5 - Add secrets management

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The `GetVehicleDetails` method of the `RDWController` in the Government service requires an API key to be specified in the URL like this: `/rdw/{apiKey}/vehicle/{licenseNumber}`.
- The Government service reads this API key from a Dapr secret store.
- The TrafficControl service reads this API key from a Dapr secret store and passes it in the call to the Government service.

## Step 1: Add a secret-store component

Before you can use the Dapr secret-store from the services, we first have to add this component to the Dapr configuration. By default, when you install Dapr there are 2 components installed:

- pub/sub (Redis cache)
- State-store (Redis cache)

Each one of these components is configured using a yaml file in a well known location (e.g. on Windows this is the `.dapr/components` folder in your user's profile folder). By default, Dapr uses these config files when starting an application with a Dapr sidecar. But you can specify a different location on the command-line. You will do that later when you're testing the application and therefore you are going to create a custom components folder for the TrafficControl service.

1. Create a new folder: `Assignment05/src/components`.
   
1. Create a new file in this folder named `pubsub.yaml` and paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: pubsub
   spec:
     type: pubsub.redis
     metadata:
       - name: redisHost
         value: localhost:6379
       - name: redisPassword
         value: ""
   ```

   This is how you configure Dapr components. They have a name which you can use in your code to specify the component to use (remember the `pubsub` name you used in the previous assignment when publishing or subscribing to a pub/sub topic). They also have a type (to specify the building-block (pub/sub in this case) and component (Redis in this case)).

1. Create a new file in the components folder named `statestore.yaml` and paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: statestore
   spec:
     type: state.redis
     metadata:
       - name: redisHost
         value: localhost:6379
       - name: redisPassword
         value: ""
       - name: actorStateStore
         value: "true"
   ```

1. Create a new file in the components folder names `secrets.json` and paste this snippet into the file:

   ```json
   {
       "rdw-api-key": "A6k9D42L061Fx4Rm2K8"
   }
   ```

   This file holds the secrets you want to use in your application. Now we need a secret-store component that uses this file so we can read the secrets using the Dapr client.

1. Create a new file in the components folder named `secrets-file.yaml` and paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: local-secret-store
     namespace: default
   spec:
     type: secretstores.local.file
     metadata:
       - name: secretsFile
         value: ../components/secrets.json
   ```

   This config file configures the file-based local secret-store. You have to specify the file containing the secrets in the metadata. Important to notice here, is that the file should be specified relative to the folder where the application is started (in this case the `Assignment05/src/GovernmentService` and `Assignment05/src/TrafficControlService` folder).

Now you're ready to add code to the Government and TrafficControl services to read the API key from the secrets-store.

## Step 2: Add API key requirement to the RDW controller in the Government service

1. Open the `Assignment 5` folder in this repo in VS Code.

You're going to change the `GetVehicleDetails` method of the `RDWController` in the Government service so it requires an API key.

1. Open a new command-shell window and go to the `Assignment05/src/GovernmentService` folder in this repo.

1. Add a reference to the Dapr ASP.NET Core integration library:

   ```
   dotnet add package Dapr.AspNetCore -v 1.0.0-rc02
   ```

1. Restore all references:

   ```
   dotnet restore
   ```

1. Open the file `Assignment05/src/GovernmentService/Controllers/RDWController.cs` in VS Code.

1. Add the following using statements to the file:

   ```csharp
   using Dapr.Client;
   using System.Collections.Generic;
   ```

1. Add a private field to the RDWController class to hold the API key:

   ```csharp
   private string _expectedAPIKey;
   ```

1. Change the signature of the RDWController constructor so it receives the DaprClient from dependency injection:

   ```csharp
   public RDWController(ILogger<RDWController> logger, IVehicleInfoRepository vehicleInfoRepository, 
      DaprClient daprClient)
   ```

1. Add code at the end of the constructor to get the API key from the secret:

   ```csharp
   // get API key
   var apiKeySecret = daprClient.GetSecretAsync("local-secret-store", "rdw-api-key",
         new Dictionary<string,string>{ { "namespace", "dapr-trafficcontrol" } }).Result;
   _expectedAPIKey = apiKeySecret["rdw-api-key"];
   ```

1. Change the `GetVehicleDetails` method so it contains an API key part:

   ```csharp
   [HttpGet("rdw/{apikey}/vehicle/{licenseNumber}")]
   public ActionResult<VehicleInfo> GetVehicleDetails(string apiKey, string licenseNumber)
   ```

1. Add a check at the start of the method to check the API key:

   ```csharp
   if (apiKey != _expectedAPIKey)
   {
       return Unauthorized();
   }
   ```

   Obviously this is NOT the way you would implement security in a real-life system! But for now the focus is on the use of the Dapr secret-store component and not the security of the sample application.

This concludes the work on the Government service.

## Step 3: Get the API Key from the secret-store in the TrafficControl service

1. Open the file `Assignment05/src/TrafficControlService/Controllers/TrafficController.cs` in VS Code.

1. Change the code for retrieving vehicle information at the beginning of the `VehicleEntry` method in this file:

   ```csharp
   // get vehicle details
   var apiKeySecret = await daprClient.GetSecretAsync("local-secret-store", "rdw-api-key");
   var apiKey = apiKeySecret["rdw-api-key"];
   var vehicleInfo = await daprClient.InvokeMethodAsync<VehicleInfo>(
       "governmentservice",
       $"rdw/{apiKey}/vehicle/{msg.LicenseNumber}",
       new HttpInvocationOptions { Method = HttpMethod.Get });
   ```

   As you can see, you first use the Dapr client to get the secret with key `rdw-api-key` from the local secret-store. This returns a dictionary of values. Then you get the API key from the dictionary and pass it in the service-to-service invocation.

## Step 4: Test the application

1. Make sure no services from previous tests are running (close the command-shell windows).

1. Open a new command-shell window and go to the `Assignment05/src/GovernmentService` folder in this repo.

1. Start the Government service. Because the TrafficControl service needs to use the secret-store component, you have to specify the custom components folder you created earlier on the command-line:

   ```
   dapr run --app-id governmentservice --app-port 6000 --dapr-grpc-port 50002 --components-path ../components dotnet run
   ```

1. Open a new command-shell window and go to the `Assignment05/src/TrafficControlService` folder in this repo.

1. Start the TrafficControl service with a Dapr sidecar. The WebAPI is running on port 5000. Because the TrafficControl service needs to use the secret-store component, you have to specify the custom components folder you created earlier on the command-line:

   ```
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-grpc-port 50001 --components-path ../components dotnet run
   ```

   If you examine the Dapr logging, you should see a line in there similar to this:

   ```
   == DAPR == time="2020-09-23T12:08:50.7645912+02:00" level=info msg="found component local-secret-store (secretstores.local.localsecretstore)" app_id=trafficcontrolservice ...
   ```

1. Open a new command-shell window and go to the `Assignment05/src/Simulation` folder in this repo.

1. Start the Simulation:

   ```
   dapr run --app-id simulation --dapr-grpc-port 50003 dotnet run
   ```

You should see the same logs as before.

## Step 5: Validate secret-store operation

To test whether the secret-store actually works, you will change the secret in the secret-store.

1. Stop the Simulation (press Ctrl-C in the command-shell window in runs in).

1. Stop the TrafficControl service (press Ctrl-C in the command-shell window in runs in).

1. Change the value of the `rdw-api-key` secret in the `secrets.json` file in the components folder to some random string.

1. Start the TrafficControl service with a Dapr sidecar.

   ```
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-grpc-port 50001 --components-path ./components dotnet run
   ```

1. Start the Simulation again from the `Assignment05/src/Simulation` folder:

   ```
   dapr run --app-id simulation --dapr-grpc-port 50003 dotnet run
   ```

Now you should see some errors in the logging because the TrafficControl service is no longer passing the correct API key in the call to the Government service:

   ```
   == APP ==       An unhandled exception has occurred while executing the request.

   == APP == Grpc.Core.RpcException: Status(StatusCode=Unauthenticated, Detail="Unauthorized")
   ```

Don't forget change the API key in the secrets file back to the correct API key.

## Final solution

You have reached the end of the hands-on assignments. If you look at the solution in the `Final` folder in this repo, you can see the code as it should be after finishing assignment 5.

Thanks for participating in these hands-on assignments! Hopefully you've learned about Dapr and how to use it. Obviously, these assignment barely scratch te surface of what is possible with Dapr. We have not touched upon subjects like: *security*, *bindings*, integration with *Azure Functions* and *Azure Logic Apps* just to name a few. So if you're interested in learning more, I suggest you read the [Dapr documentation](https://github.com/dapr/docs).