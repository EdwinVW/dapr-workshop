# Assignment 3 - Add pub/sub messaging

## Assignment goals

In order to complete this assignment, the following goals must be met:

1. The TrafficControlService sends `SpeedingViolation` messages using the Dapr pub/sub building block.

1. The FineCollectionService receives `SpeedingViolation` messages using the Dapr pub/sub building block.

1. RabbitMQ is used as pub/sub message broker that runs as part of the solution in a Docker container.

> Don't worry if you have no experience with RabbitMQ. You will run it as a container in the background and don't need to interact with it directly in any way. The instructions will explain exactly how to do that.

This assignment targets number **2** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Consume messages in the FineCollectionService

First you are going to prepare the FineCollectionService so it can receive messages using Dapr pub/sub.

With the Dapr pub/sub building-block, you use a *topic* to send and receive messages. The producer sends messages to the topic and a (or more) consumer(s) subscribe to this topic to receive messages. The Dapr ASP.NET Core integration library offers an elegant way of linking an ASP.NET Core WebAPI method to a pub/sub topic. For every message sent to that topic, the WebAPI method is invoked and the payload of the message is delivered as request body. You don't have to poll for messages on the message-broker.

1. Open the `src` folder in this repo in VS Code.

1. If you have executed assignment 2, you can skip the next two tasks.

1. Open the terminal window in VS Code and make sure the current folder is `src/FineCollectionService`.

1. Add a reference to the Dapr ASP.NET Core integration library:

   ```console
   dotnet add package Dapr.AspNetCore
   ```

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Add a using statement in this file so you can use Dapr:

   ```csharp
   using Dapr;
   ```

1. Add an attribute above the `CollectFine` method to link this method to a topic called `collectfine`:

   ```csharp
   [Topic("pubsub", "collectfine")]
   ```

   > The *"pubsub"* argument passed to this attribute specifies the name of the pub/sub component to use. You will configure a pub/sub component that uses the RabbitMQ message-broker later in this assignment.

Now you need to make sure that Dapr knows this controller and also knows which pub/sub topics the controller subscribes to. To determine this, Dapr will call your service on a default endpoint to retrieve the subscriptions. To make sure your service handles this request and returns the correct information, you need to add some statements to the `Startup` class:

1. Open the file `src/FineCollectionService/Startup.cs` in VS Code.

1. Add `AddDapr` to the `AddControllers` line in the `ConfigureServices` method:

   ```csharp
   services.AddControllers().AddDapr();
   ```

1. Dapr uses the *CloudEvent* message-format standard when sending messages over pub/sub. To enable this, add the following line just after the call to `app.UseRouting()` in the `Configure` method:

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

1. Open the terminal window in VS Code and make sure the current folder is `src/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   dotnet build
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

This is the receiving part done. Now you need to update the TrafficControlService so that it uses Dapr pub/sub to send messages to the FineCollectionService.

## Step 2: Publish messages from the TrafficControl service

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

1. Add an argument named `daprClient` of type `DaprClient` that is decorated with the `[FromServices]` attribute to the `ExitCam` method :

   ```csharp
   public async Task<ActionResult> VehicleExit(VehicleRegistered msg, [FromServices] DaprClient daprClient)
   ```

   > The `[FromServices]` attribute This makes sure that the `DaprClient` is automatically injected by the ASP.NET Core dependency injection system.

1. Near the end of the method, you find the code that sends a `SpeedingViolation` message to the FineCollectionService over HTTP:

   ```csharp
   // publish speedingviolation
   var message = JsonContent.Create<SpeedingViolation>(speedingViolation);
   await _httpClient.PostAsync("http://localhost:5001/collectfine", message);
   ```

1. Replace this code with a call to the Dapr pub/sub building block using the DaprClient:

   ```csharp
   // publish speedingviolation
   await daprClient.PublishEventAsync("pubsub", "collectfine", speedingViolation);
   ```

1. Open the file `src/TrafficControlService/Startup.cs`.

1. The service now uses the `DaprClient`. Therefore, it needs to be registered with dependency injection. Add the following line to the `ConfigureServices` method to register the `DaprClient` with dependency injection:

    ```csharp
    services.AddDaprClient();
    ```

1. Open the terminal window in VS Code and make sure the current folder is `src/TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

    ```console
    dotnet build
    ```

    If you see any warnings or errors, review the previous steps to make sure the code is correct.

## Step 4: Run RabbitMQ as message broker

Now it's time to add a new infrastructural component to the solution. You're going to pull a standard Docker image containing RabbitMQ to your machine and start it as a container.

1. Open the terminal window in VS Code.

1. Start a RabbitMQ message-broker by entering the following command:

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

## Step 5: Configure the pub/sub component

Until now, you have been using the Dapr components that are installed by default when you install Dapr on a machine. These are a state management component and a pub/sub component. They both use the Redis server that is also installed by default. These components are installed in the folder `%USERPROFILE%\.dapr\components` on Windows and `$HOME/.dapr/components` on Linux or Mac.

Because you need to change the message-broker from Redis to RabbitMQ, you will create a separate folder with the component configuration files and use this folder when starting the services using the Dapr CLI. You can specify which folder to use on the command-line with the `--components-path` flag.

1. Create a new folder `src/dapr/components`.

1. Copy all files from the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on Linux or Mac to the `src/dapr/components` folder.

1. Open the file `src/dapr/components/pubsub.yaml` in VS Code.

1. Inspect this file. As you can see, it specifies the type of the message-broker to use (`pubsub.redis`) and specifies information on how to connect to the Redis server in the `metadata` section.

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
   ```

As you can see, you specify a different type of pub/sub component (`pubsub.rabbitmq`) and you specify in the `metadata` how to connect to the RabbitMQ container you started in step 4 (running on localhost on port `5672`). The other metadata can be ignored for now.

## Step 6: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the command-shell windows).

1. Open the terminal window in VS Code and make sure the current folder is `src/VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 5002 --dapr-http-port 3502 --dapr-grpc-port 50002 --components-path ../dapr/components dotnet run
   ```

   > Notice that you specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use RabbitMQ for pub/sub.

1. Open a **new** terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 5001 --dapr-http-port 3501 --dapr-grpc-port 50001 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-http-port 3500 --dapr-grpc-port 50000 --components-path ../dapr/components dotnet run
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

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 4](../Assignment04/README.md).
