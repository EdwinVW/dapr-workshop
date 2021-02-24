# Assignment 4 - Add pub/sub messaging

## Assignment goals

In order to complete this assignment, the following goals must be met:

1. The simulation uses the Dapr client to send messages over pub/sub to the TrafficControl service (vehicle entry and vehicle exit).
2. The TrafficControl service uses the Dapr client to send messages to the Government service (for communicating speeding violations to the CJIB).

## Step 1: Make the WebAPI methods pub/sub consumers

1. Open the `Assignment 4` folder in this repo in VS Code.

First you are going to prepare the TrafficControl service so it can receive messages sent using Dapr pub/sub.

With the Dapr pub/sub building-block, you use a *topic* to send and receive messages. The producer sends messages to the topic and a (or more) consumer(s) subscribe to this topic to receive messages. The Dapr ASP.NET integration library offers an elegant way of linking an WebAPI method to a pub/sub topic. For every message sent to that topic, the WebAPI method is called (as if it was called directly over HTTP).

1. Open the file `Assignment04/src/TrafficControlService/Controllers/TrafficController.cs` in VS Code.

2. Add a using statement in this file so you can use Dapr classes:

   ```csharp
   using Dapr;
   ```

3. Add an attribute above the `VehicleEntry` method to link this method to a topic called `trafficcontrol.entrycam`:

   ```csharp
   [Topic("pubsub", "trafficcontrol.entrycam")]
   ```

   The *"pubsub"* argument passed to this attribute specifies the name of the pub/sub component to use. This is the default pub/sub component installed with dapr. This uses a Redis cache as message broker.

4. Add an attribute above the `VehicleExit` method to link this method to a topic called `trafficcontrol.exitcam`:

   ```csharp
   [Topic("pubsub", "trafficcontrol.exitcam")]
   ```

## Step 2: Integrate Dapr into ASP.NET Core

Now you need to make sure that Dapr knows this controller and also knows which pub/sub topics the controller subscribes to. To determine this, Dapr will call your service on a default endpoint to retrieve the subscriptions. To make sure your service handles this request and returns the correct information, you need to add some stuff to the `Startup` class:

1. Open the file `Assignment04/src/TrafficControlService/Startup.cs` in VS Code.

2. Change the `AddControllers` line in the `ConfigureServices` method in this file to:

   ```csharp
   services.AddControllers().AddDapr();
   ```

3. Dapr uses the *CloudEvent* message-format standard when sending messages over pub/sub. To enable this, add the following line just after the call to `app.UseRouting();` in the `Configure` method:

   ```csharp
   app.UseCloudEvents();
   ```

4. To register every controller that uses pub/sub as a subscriber, change the call to `UseEndpoints` in the `Configure` method so it looks like this:

   ```csharp
   app.UseEndpoints(endpoints =>
   {
         endpoints.MapSubscribeHandler();
         endpoints.MapControllers();
   });
   ```

This is the receiving part done. Now you need to update the simulation so that it uses Dapr pub/sub to send messages to the TrafficControl service.

## Step 3: Publish messages from the Simulation to the TrafficControl service

1. Open a command-shell window and go to the `Assignment04/src/Simulation` folder in this repo.

2. Remove the reference to `System.Net.Http`:

   ```
   dotnet remove package System.Net.Http
   ```

3. Add a reference to the Dapr client:

   ```
   dotnet add package Dapr.Client -v 1.0.0-rc02
   ```

4. Restore all references:

   ```
   dotnet restore
   ```

5. Open the file `Assignment04/src/Simulation/CameraSimulation.cs` in VS Code.

6. In this file, remove the using statement for `System.Net.Http` and add one for using the Dapr client:

   ```csharp
   using Dapr.Client;
   ```

7. Replace the creation of an `HttpClient` in the `Start` method with the creation of a Dapr client. Later in this assignment, you will start the Simulation with its own Dapr side-car. You need to specify the gRPC port that will be used for communicating with the side-car (`50003`):

   ```csharp
   var daprClient = new DaprClientBuilder()
      .UseEndpoint("http://localhost:50003")
      .Build();
   ```

8. Replace the serialization of the `VehicleRegistered` event and the sending of the data using the HttpClient:

   ```csharp
   var @eventJson = new StringContent(JsonSerializer.Serialize(@event, _jsonSerializerOptions), Encoding.UTF8, "application/json");
   httpClient.PostAsync("http://localhost:5000/trafficcontrol/entrycam", @eventJson).Wait();
   ```

   with this call to the Dapr client:

   ```csharp
   daprClient.PublishEventAsync("pubsub", "trafficcontrol.entrycam", @event).Wait();
   ```

   As you can see, this uses the same topic-name (*trafficcontrol.entrycam*) as we used in the TrafficControl service. The "pubsub" argument passed into the `PublishEventAsync` method is the name of the pub/sub component to use. By default Dapr uses the Redis cache installed with Dapr as message broker.

9. Also replace the Http client code with the Dapr client for the exit event:

   ```csharp
   daprClient.PublishEventAsync("pubsub", "trafficcontrol.exitcam", @event).Wait();
   ```

Now you're ready to test the application.

## Step 4: Test the application

1. Make sure no services from previous tests are running (close the command-shell windows).

2. Open a new command-shell window and go to the `Assignment04/src/GovernmentService` folder in this repo.

3. Start the Government service:

   ```
   dapr run --app-id governmentservice --app-port 6000 --dapr-grpc-port 50002 dotnet run
   ```

2. Open a new command-shell window and go to the `Assignment04/src/TrafficControlService` folder in this repo.

3. Start the TrafficControl service with a Dapr sidecar. The WebAPI is running on port 5000:

   ```
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-grpc-port 50001 dotnet run
   ```

4. Open a new command-shell window and go to the `Assignment04/src/Simulation` folder in this repo.

5. Start the Simulation. You will now start the Simulation with its own side-car and use gRPC port `50003` (as specified in the code):

   ```
   dapr run --app-id simulation --dapr-grpc-port 50003 dotnet run
   ```

You should see the same logs as before. Obviously, the behavior of the application is exactly the same as before. But if you look closely at the Dapr logs of the TrafficControl service, you should see something like this in there:

```
== DAPR == time="2020-09-23T08:05:34.2950896+02:00" level=info msg="app is subscribed to the following topics: [trafficcontrol.entrycam trafficcontrol.exitcam] through pubsub=pubsub" app_id=trafficcontrolservice ...
```

So you can see that Dapr has asked the service which topics it subscribes on and created the subscriptions. You can also check whether messages are actually sent through the Redis cache.

## Step 5: Validate use of the Redis cache as message-queue

1. First stop the TrafficControl service (press Ctrl-C in the command-shell window in runs in). The Simulation will keep sending messages via pub/sub that are not consumed by anyone.

2. Wait until several vehicles are simulated.

3. Stop the Simulation (Ctrl-C in the command-shell window it runs in).

4. Now restart the TrafficControl service:

   ```
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-grpc-port 50001 dotnet run
   ```

Now you should see in the logging that - although the simulation is not running - messages are coming into the TrafficControl service. This is one of the great advantages of using pub/sub messaging. The producer and consumer are decoupled from each-other and don't have to be online at the same time in order to work together.

## Step 6: Publish messages from the TrafficControl service to the Government service

This is an optional step for which I will leave it up to you to change the application so that the `HandleSpeedingViolation` on the `CJIBController` of the Government service can be called using pub/sub and the TrafficControl service uses pub/sub to send speeding violations to this endpoint.

Basically you can follow the same steps as you did earlier in this assignment but now for the Government service. Use `cjib.speedingviolation` as topic name.

## Next assignment

Make sure you stop all running processes before proceeding to the next assignment.

Go to [assignment 5](../Assignment05/README.md).