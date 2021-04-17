# Assignment 3 - Add pub/sub messaging

## Assignment goals

To complete this assignment, you must reach the following goals:

1. The TrafficControlService sends `SpeedingViolation` messages using the Dapr pub/sub building block.

1. The FineCollectionService receives `SpeedingViolation` messages using the Dapr pub/sub building block.

1. RabbitMQ is used as pub/sub message broker that runs as part of the solution in a Docker container.

> Don't worry if you have no experience with RabbitMQ. You will run it as a container in the background and don't need to interact with it directly in any way. The instructions will explain exactly how to do that.

This assignment targets number **2** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Run RabbitMQ as message broker

In the example, you will use RabbitMQ as the message broker with the Dapr pub/sub building block. You're going to pull a standard Docker image containing RabbitMQ to your machine and start it as a container.

1. Open the terminal window in VS Code.

1. Start a RabbitMQ message broker by entering the following command:

   ```console
   docker run -d -p 5672:5672 --name dtc-rabbitmq rabbitmq:3-alpine
   ```

This will pull the docker image `rabbitmq:3-alpine` from Docker Hub and start it. The name of the container will be `dtc-rabbitmq`. The server will be listening for connections on port `5672` (which is the default port for RabbitMQ).

If everything goes well, you should see some output like this:

![](img/docker-rmq-output.png)

> If you see any errors, make sure you have access to the Internet and are able to download images from Docker Hub. See [Docker Hub](https://hub.docker.com/) for more info.

The container will keep running in the background. If you want to stop it, enter the following command:

```console
docker stop dtc-rabbitmq
```

You can then start the container later by entering the following command:

```console
docker start dtc-rabbitmq
```

If you are done using the container, you can also remove it by entering the following command:

```console
docker rm dtc-rabbitmq -f
```

Once you have removed it, you need to start it again with the `docker run` command shown at the beginning of this step.

> For your convenience, the `src/Infrastructure` folder contains Powershell scripts for starting the infrastructural components you'll use throughout the workshop. You can use the `src/Infrastructure/rabbitmq/start-rabbitmq.ps1` script to start the RabbitMQ container.
>
> If you don't mind starting all the infrastructural containers at once (also for assignments to come), you can also use the `src/Infrastructure/start-all.ps1` script.

## Step 2: Configure the pub/sub component

Until now, you have been using the Dapr components that are installed by default when you install Dapr on your machine. These are a state management component and a pub/sub component. They both use the Redis server that is also installed by default. The components are installed in the folder `%USERPROFILE%\.dapr\components` on Windows and `$HOME/.dapr/components` on Linux or Mac.

Because you need to change the message broker from Redis to RabbitMQ, you will create a separate folder with the component configuration files and use this folder when starting the services using the Dapr CLI. You can specify which folder to use on the command-line with the `--components-path` flag.

1. Create a new folder `src/dapr/components`.

1. Copy all files from the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on Linux or Mac to the `src/dapr/components` folder.

1. Open the file `src/dapr/components/pubsub.yaml` in VS Code.

1. Inspect this file. As you can see, it specifies the type of the message broker to use (`pubsub.redis`) and specifies information on how to connect to the Redis server in the `metadata` section.

1. Change the content of this file to:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: pubsub
   spec:
     type: pubsub.rabbitmq
     version: v1
     metadata:
     - name: host
       value: "amqp://localhost:5672"
     - name: durable
       value: "false"
     - name: deletedWhenUnused
       value: "false"
     - name: autoAck
       value: "false"
     - name: reconnectWait
       value: "0"
     - name: concurrency
       value: parallel
   scopes:
     - trafficcontrolservice
     - finecollectionservice
   ```

As you can see, you specify a different type of pub/sub component (`pubsub.rabbitmq`) and you specify in the `metadata` how to connect to the RabbitMQ container you started in step 1 (running on localhost on port `5672`). The other metadata can be ignored for now. In the `scopes` section, you specify that only the TrafficControlService and FineCollectionService should use the pub/sub building block.

## Step 3: Send messages from the TrafficControlService

With the Dapr pub/sub building block, you use a *topic* to send and receive messages. The producer sends messages to the topic and a (or more) consumer(s) subscribe to this topic to receive messages. First you are going to prepare the TrafficControlService so it can send messages using Dapr pub/sub.

1. Open the file `src/TrafficControlService/Controllers/TrafficController.cs` in VS Code.

1. Near the end of the `VehicleExit` method, you find the code that sends a `SpeedingViolation` message to the FineCollectionService over HTTP:

   ```csharp
   // publish speedingviolation
   var message = JsonContent.Create<SpeedingViolation>(speedingViolation);
   await _httpClient.PostAsync("http://localhost:6001/collectfine", message);
   ```

1. The URL for publishing a message using the Dapr pub/sub API is: `http://localhost:<daprPort>/v1.0/publish/<pubsub-name>/<topic>`. You'll use this API to send a message to the `collectfine` topic using the pub/sub component named `pubsub`. The Dapr sidecar for the TrafficControlService runs on HTTP port `3600`. Replace the URL in the HTTP call with a call to the Dapr pub/sub API:

   ```csharp
   await _httpClient.PostAsync("http://localhost:3600/v1.0/publish/pubsub/collectfine", message);
   ```

That's it. You now use Dapr pub/sub to publish a message to a message broker.

## Step 4: Receive messages in the FineCollectionService (declaratively)

Now you are going to prepare the FineCollectionService so it can receive messages using Dapr pub/sub. Consuming messages can be done in two ways: *declaratively* (through configuration) or *programmatic* (from the code). First you'll use the declarative way. Later you'll also use the programmatic way and finally also using the Dapr SDK for .NET.

1. Add a new file in the `src/dapr/components` folder named `subscription.yaml`.

1. Open this file in VS Code.

1. You're going to define a subscription on a topic and link that to a web API operation on the FineCollectionService. Paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Subscription
   metadata:
     name: collectfine-subscription
   spec:
     topic: collectfine
     route: /collectfine
     pubsubname: pubsub
   scopes:
   - finecollectionservice
   ```

   The `route` field tells Dapr to forward all messages send to the `collectfine` topic to the `/collectfine` endpoint in the app. The `scopes` field restricts this subscription to only the service with app-id `finecollectionservice` only.

Now your FineCollectionService is ready to receive messages through Dapr pub/sub. But there is a catch! Dapr uses the [CloudEvents](https://cloudevents.io/) message format for pub/sub. So when we send a message through pub/sub, the receiving application needs to understand this format and handle the message as a `CloudEvent`. Therefore we need to change the code slightly. For now, you will parse the incoming JSON by hand (instead of ASP.NET Core model binding doing that for you). You will change this later when you will use the Dapr SDK for .NET.

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Remove the `SpeedingViolation` parameter from the `CollectFine` method and replace this with a `cloudevent` parameter of type `System.Text.Json.JsonDocument` that is decorated with the `[FromBody]` attribute:

   ```csharp
   public async Task<ActionResult> CollectFine([FromBody] System.Text.Json.JsonDocument cloudevent)
   ```

   > This enables you to get to the raw JSON in the request.

1. Add the following code at the top of the method to extract the `SpeedingViolation` data from the cloud event:

   ```csharp
   var data = cloudevent.RootElement.GetProperty("data");
   var speedingViolation = new SpeedingViolation
   {
       VehicleId = data.GetProperty("vehicleId").GetString(),
       RoadId = data.GetProperty("roadId").GetString(),
       Timestamp = data.GetProperty("timestamp").GetDateTime(),
       ViolationInKmh = data.GetProperty("violationInKmh").GetInt32()
   };
   ```

1. Open the terminal window in VS Code and make sure the current folder is `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

## Step 5: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the command-shell windows).

1. Open the terminal window in VS Code and make sure the current folder is `src/VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components dotnet run
   ```

   > Notice that you specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use RabbitMQ for pub/sub.

1. Open a **new** terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/Simulation`.

1. Start the simulation:

   ```console
   dotnet run
   ```

You should see the same logs as before. Obviously, the behavior of the application is exactly the same as before. But if you look closely at the Dapr logs of the FineCollectionService, you should see something like this in there:

```console
time="2021-02-27T16:46:02.5989612+01:00" level=info msg="app is subscribed to the following topics: [collectfine] through pubsub=pubsub" app_id=finecollectionservice instance=EDWINW01 scope=dapr.runtime type=log ver=1.0.0
```

So you can see that Dapr has asked the service which topics it want to subscribes to and created the necessary subscription to the `collectfine` topic.

## Step 6: Receive messages in the FineCollectionService (programmatic)

The other way of subscribing to pub/sub events is the programmatic way. Dapr will call your service on the well known endpoint `/dapr/subscribe` to retrieve the subscriptions for that service. You will implement this endpoint and return the subscription for the `collectfine` topic.

1. Stop the FineCollectionService by navigating to its terminal window and pressing `Ctrl-C`. You can keep the other services running for now.

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Add a new operation named `Subscribe` to the controller that will listen to the route `/dapr/dubscribe`:

   ```csharp
   [Route("/dapr/subscribe")]
   [HttpGet()]
   public object Subscribe()
   {
       return new object[]
       {
           new
           {
               pubsubname = "pubsub",
               topic = "collectfine",
               route = "/collectfine"
           }
       };
   }
   ```

1. Remove the file `src/dapr/components/subscription.yaml`. This file is not needed anymore because you implemented the `/dapr/subscribe` method.

1. Go back to the terminal window in VS Code and make sure the current folder is `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

1. Start the updated FineCollectionService:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components dotnet run
   ```

1. After you've looked at the log output and confirmed that everything works, you can stop all the services.

## Step 7: Use Dapr publish / subscribe with the Dapr SDK for .NET

In this step, you will change the code slightly so it uses the Dapr SDK for .NET. First you'll change the TrafficControlService that sends messages.

1. Open the terminal window in VS Code and make sure the current folder is `src/TrafficControlService`.

1. Add a reference to the Dapr ASP.NET Core integration package:

   ```console
   dotnet add package Dapr.AspNetCore
   ```

1. Open the file `src/TrafficControlService/Controllers/TrafficController.cs` in VS Code.

1. In this file, add a using statement for the Dapr client:

   ```csharp
   using Dapr.Client;
   ```

1. Add an argument named `daprClient` of type `DaprClient` that is decorated with the `[FromServices]` attribute to the `VehicleExit` method :

   ```csharp
   public async Task<ActionResult> VehicleExit(VehicleRegistered msg, [FromServices] DaprClient daprClient)
   ```

   > The `[FromServices]` attribute injects the `DaprClient` into the method using the ASP.NET Core dependency injection system.

1. Near the end of the method, you'll find the code that publishes the `SpeedingViolation` message using `_httpClient`:

   ```csharp
   // publish speedingviolation
   var message = JsonContent.Create<SpeedingViolation>(speedingViolation);
   await _httpClient.PostAsync("http://localhost:3600/v1.0/publish/pubsub/collectfine", message);
   ```

1. Replace this code with a call to the Dapr pub/sub building block using the DaprClient:

   ```csharp
   // publish speedingviolation
   await daprClient.PublishEventAsync("pubsub", "collectfine", speedingViolation);
   ```

1. Open the file `src/TrafficControlService/Startup.cs`.

1. The service now uses the `DaprClient`. Therefore, it needs to be registered with dependency injection. Add the following line to the `ConfigureServices` method to register the `DaprClient` with dependency injection:

   ```csharp
   services.AddDaprClient(builder => builder
       .UseHttpEndpoint($"http://localhost:3600")
       .UseGrpcEndpoint($"http://localhost:60000"));
   ```

1. Open the terminal window in VS Code and make sure the current folder is `src/TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you will change the FineCollectionService that receives messages. The Dapr ASP.NET Core integration library offers an elegant way of linking an ASP.NET Core WebAPI method to a pub/sub topic. For every message sent to that topic, the WebAPI method is invoked and the payload of the message is delivered as request body. You don't have to poll for messages on the message broker.

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Remove the `Subscribe` method from the controller.

1. Replace the `cloudevent` parameter of the `CollectFine` method with a parameter of type `SpeedingViolation` named `speedingViolaton`:

   ```csharp
   public async Task<ActionResult> CollectFine(SpeedingViolation speedingViolation)
   ```

1. Remove the code that parses the cloud event data at the beginning of the method:

   ```csharp
   var data = cloudevent.RootElement.GetProperty("data");
   var speedingViolation = new SpeedingViolation
   {
       VehicleId = data.GetProperty("vehicleId").GetString(),
       RoadId = data.GetProperty("roadId").GetString(),
       Timestamp = data.GetProperty("timestamp").GetDateTime(),
       ViolationInKmh = data.GetProperty("violationInKmh").GetInt32()
   };
   ```

1. Add a using statement in this file so you can use Dapr:

   ```csharp
   using Dapr;
   ```

1. Add an attribute above the `CollectFine` method to link this method to a topic called `collectfine`:

   ```csharp
   [Topic("pubsub", "collectfine")]
   ```

   > The *"pubsub"* argument passed to this attribute refers to the name of the Dapr pub/sub component to use.

Now you need to make sure that Dapr knows this controller and also knows which pub/sub topics the controller subscribes to. To determine this, Dapr will call your service on a default endpoint to retrieve the subscriptions. To make sure your service handles this request and returns the correct information, you need to add some statements to the `Startup` class:

1. Open the file `src/FineCollectionService/Startup.cs` in VS Code.

1. Add `AddDapr` to the `AddControllers` line in the `ConfigureServices` method:

   ```csharp
   services.AddControllers().AddDapr();
   ```

   > The `AddDapr` method adds Dapr integration for ASP.NET MVC.

1. As you saw earlier, Dapr uses the cloud event message-format standard when sending messages over pub/sub. To make sure cloud events are automatically unwrapped, add the following line just after the call to `app.UseRouting()` in the `Configure` method:

   ```csharp
   app.UseCloudEvents();
   ```

1. To register every controller that uses pub/sub as a subscriber, add a call to `endpoints.MapSubscribeHandler()` to the lambda passed into `app.UseEndpoints` in the `Configure` method. It should look like this:

   ```csharp
   app.UseEndpoints(endpoints =>
   {
       endpoints.MapSubscribeHandler();
       endpoints.MapControllers();
   });
   ```

   > By adding this, the `/dapr/subscribe` endpoint that you implemented in step 6 is automatically implemented by Dapr. It will collect all the controller methods that are decorated with the Dapr `Topic` attribute and return the corresponding subscriptions.

1. Open the terminal window in VS Code and make sure the current folder is `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you can test the application again. Execute the activities in step 5 again.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 4](../Assignment04/README.md).
