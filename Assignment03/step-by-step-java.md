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

> For your convenience, the `src-java/Infrastructure` folder contains Bash scripts for starting the infrastructural components you'll use throughout the workshop. You can use the `src/Infrastructure/rabbitmq/start-rabbitmq.sh` script to start the RabbitMQ container.
>
> If you don't mind starting all the infrastructural containers at once (also for assignments to come), you can also use the `src/Infrastructure/start-all.sh` script.

## Step 2: Configure the pub/sub component

Until now, you have been using the Dapr components that are installed by default when you install Dapr on your machine. These are a state management component and a pub/sub component. They both use the Redis server that is also installed by default. The components are installed in the folder `%USERPROFILE%\.dapr\components` on Windows and `$HOME/.dapr/components` on Linux or Mac.

Because you need to change the message broker from Redis to RabbitMQ, you will create a separate folder with the component configuration files and use this folder when starting the services using the Dapr CLI. You can specify which folder to use on the command-line with the `--components-path` flag.

1. Create a new folder `src-java/dapr/components`.

1. Copy all files from the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on Linux or Mac to the `src-java/dapr/components` folder.

1. Open the file `src-java/dapr/components/pubsub.yaml` in VS Code.

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

With the Dapr pub/sub building block, you use a *topic* to send and receive messages. The producer sends messages to the topic and one or more consumers subscribe to this topic to receive those messages. First you are going to prepare the TrafficControlService so it can send messages using Dapr pub/sub.

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/fines/DefaultFineCollectionClient.java` in VS Code.

1. Inside the `submitForFine` method, you find the code that sends a `SpeedingViolation` message to the `collectfine` endpoint of the FineCollectionService over HTTP:

   ```java
   restTemplate.postForObject(fineCollectionEndpoint, speedingViolation, Void.class);
   ```

   The `restTemplate` is a utility provided by Spring to invoke the FineCollectionService. Its base address for consuming that REST web service is injected through the constructor of that class. That constructor is invoked from a Spring configuration class, which in turn reads the Spring configuration file using `@Value`.

1. Open the file `src-java/TrafficControlService/src/main/resources/application.yml` in VS Code.

   Here we see the actual value being configured. Inspect the `fine-collection.address` setting. You can see that in the HTTP call, the URL of the VehicleRegistrationService (running on port 6001) is used.

1. The URL for publishing a message using the Dapr pub/sub API is: `http://localhost:<daprPort>/v1.0/publish/<pubsub-name>/<topic>`. You'll use this API to send a message to the `speedingviolations` topic using the pub/sub component named `pubsub`. The Dapr sidecar for the TrafficControlService runs on HTTP port `3600`. Replace the URL in the HTTP call with a call to the Dapr pub/sub API:

   ```yml
   fine-collection.address: http://localhost:3600/v1.0/publish/pubsub/speedingviolations
   ```

That's it. You now use Dapr pub/sub to publish a message to a message broker.

## Step 4: Receive messages in the FineCollectionService (declaratively)

Now you are going to prepare the FineCollectionService so it can receive messages using Dapr pub/sub. Consuming messages can be done in two ways: *declaratively* (through configuration) or *programmatic* (from the code). First you'll use the declarative way. Later you'll also use the programmatic way and finally also using the Dapr SDK for Java.

1. Add a new file in the `src-java/dapr/components` folder named `subscription.yaml`.

1. Open this file in VS Code.

1. You're going to define a subscription on a topic and link that to a web API operation on the FineCollectionService. Paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Subscription
   metadata:
     name: speedingviolations-subscription
   spec:
     topic: speedingviolations
     route: /collectfine
     pubsubname: pubsub
   scopes:
   - finecollectionservice
   ```

   The `route` field tells Dapr to forward all messages send to the `speedingviolations` topic to the `/collectfine` endpoint in the app. The `scopes` field restricts this subscription to only the service with app-id `finecollectionservice` only.

Now your FineCollectionService is ready to receive messages through Dapr pub/sub. But there is a catch! Dapr uses the [CloudEvents](https://cloudevents.io/) message format for pub/sub. So when we send a message through pub/sub, the receiving application needs to understand this format and handle the message as a `CloudEvent`. Therefore we need to change the code slightly. For now, you will read the incoming JSON by hand (instead of the Jackson model binding doing that for you). You will change this later when you will use the Dapr SDK for Java.

1. Open the file `src-java/FineCollectionService/src/main/java/dapr/fines/violation/ViolationController.java` in VS Code.

1. Remove the `SpeedingViolation request` parameter from the `registerViolation` method and replace this with a `event` parameter of type `JsonNode`, and leave the `@RequestBody` annotation in place:

   ```java
   public ResponseEntity<Void> registerViolation(@RequestBody final JsonNode event) {
   ```

   Add an import for the `com.fasterxml.jackson.databind.JsonNode` class.

   > This enables you to get to the raw JSON in the request.

1. Add the following code in the body of the method to extract the `SpeedingViolation` data from the event:

   ```java
   var data = event.get("data");
   var violation = new SpeedingViolation(
           data.get("licenseNumber").asText(),
           data.get("roadId").asText(),
           data.get("excessSpeed").asInt(),
           LocalDateTime.parse(data.get("timestamp").asText())
   );
   ```

   Also, add an import for the `java.time.LocalDateTime` class.

1. Open the terminal window in VS Code and make sure the current folder is `src-java/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

## Step 5: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the command-shell windows).

1. Open the terminal window in VS Code and make sure the current folder is `src-java/VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components mvn spring-boot:run
   ```

   > Notice that you specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use RabbitMQ for pub/sub.

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

You should see the same logs as before. Obviously, the behavior of the application is exactly the same as before. But if you look closely at the Dapr logs of the FineCollectionService, you should see something like this in there:

```console
INFO[0004] app is subscribed to the following topics: [speedingviolations] through pubsub=pubsub  app_id=finecollectionservice instance=maartenm03 scope=dapr.runtime type=log ver=1.2.2
```

So you can see that Dapr has registered a subscription for the FineCollectionService to the `speedingviolations` topic.

## Step 6: Receive messages in the FineCollectionService (programmatic)

The other way of subscribing to pub/sub events is the programmatic way. Dapr will call your service on the well known endpoint `/dapr/subscribe` to retrieve the subscriptions for that service. You will implement this endpoint and return the subscription for the `speedingviolations` topic.

1. Stop the FineCollectionService by navigating to its terminal window and pressing `Ctrl-C`. You can keep the other services running for now.

1. Open the file `src-java/FineCollectionService/src/main/java/dapr/fines/violation/ViolationController.java` in VS Code.

1. Add a new method `subscribe` to the controller that will listen to the route `/dapr/dubscribe`:

   ```java
   @GetMapping("/dapr/subscribe")
   public ResponseEntity<List<Map<String, Object>>> subscribe() {
       var subscription = Map.<String, Object>of(
           "pubsubname", "pubsub",
           "topic", "speedingviolations",
           "route", "/collectfine"
       );
       return ResponseEntity.ok(Collections.singletonList(subscription));
   }
   ```

1. Remove the file `src/dapr/components/subscription.yaml`. This file is not needed anymore because you implemented the `/dapr/subscribe` method.

1. Go back to the terminal window in VS Code and make sure the current folder is `src-java/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

1. Start the updated FineCollectionService:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components mvn spring-boot:run
   ```

1. After you've looked at the log output and confirmed that everything works, you can stop all the services.

## Step 7: Use Dapr publish / subscribe with the Dapr SDK for Java

In this step, you will change the code slightly so it uses the Dapr SDK for Java. First you'll change the TrafficControlService that sends messages.

1. Add a dependency to the Dapr SDK for Java to the pom.xml in the TrafficControlService directory:

   ```xml
   <dependency>
      <groupId>io.dapr</groupId>
      <artifactId>dapr-sdk</artifactId>
   </dependency>
   ```

   Again, the version of the dependency is managed using Mavens "dependency management" - you can inspect the pom.xml file inside the src-java folder to see the exact version.

1. Create a new file, src-java/TrafficControlService/src/main/java/dapr/traffic/fines/DaprFineCollectionClient.java and open it in VS Code.

1. Declare a class DaprFineCollectionClient that implements the FineCollectionClient interface. To fulfil the contract of the FineCollectionClient interface, add the following method:

  ```java
  @Override
  public void submitForFine(SpeedingViolation speedingViolation) {
  }
  ```

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/TrafficControlConfiguration.java` in VS Code. The default JSON serialization is not suitable for todays goal, so you need to customize the Jackson `ObjectMapper` that it uses. You do so by adding a static inner class to configure the JSON serialization:

  ```java
  static class JsonObjectSerializer extends DefaultObjectSerializer {
      public JsonObjectSerializer() {
          OBJECT_MAPPER.registerModule(new JavaTimeModule());
          OBJECT_MAPPER.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
      }
  }
  ```

  This is a bit of a lazy approach, but it is enough for this workshop. In fact, the SDK documentation [recommends to write your own serializer for production scenario's](https://github.com/dapr/java-sdk#how-to-use-a-custom-serializer).

1. In the same class, add a new method to declare a Spring Bean of type DaprClient:

  ```java
  @Bean
  public DaprClient daprClient() {
      return new DaprClientBuilder()
              .withObjectSerializer(new JsonObjectSerializer())
              .build();
  }
  ```

  In the same class, the fineCollectionClient method declares a Spring Bean that provides an implementation of the FineCollectionClient interface. To do so, it needs a RestTemplate bean. Replace this method with the following:

  ```java
  @Bean
  public FineCollectionClient fineCollectionClient(final DaprClient daprClient) {
      return new DaprFineCollectionClient(daprClient);
  }
  ```

  Finally, update the import statements in the class:

  ```java
  import dapr.traffic.fines.DaprFineCollectionClient;
  import io.dapr.client.DaprClient;
  import io.dapr.client.DaprClientBuilder;
  ```

1. Go back to the DaprFineCollectionClient implementation class and add a using statement in this file to make sure you can use the Dapr client:

  ```java
  import io.dapr.client.DaprClient;
  ```

  Now add an instance variable of type DaprClient, and add a constructor to inject it:

  ```java
  private final DaprClient daprClient;

  public DaprFineCollectionClient(final DaprClient daprClient) {
     this.daprClient = daprClient;
  }
  ```

1. Finally, update the `submitForFine()` method in this class to use the `DaprClient`:

  ```java
  daprClient.publishEvent("pubsub",  "speedingviolations", speedingViolation).block();
  ```

1. Open the terminal window in VS Code and make sure the current folder is `src-java/TrafficControlService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you will change the FineCollectionService that receives messages. The Dapr SDK for Java provides an additional Spring Boot integration library, which automatically wires correctly annotated methods to a pub/sub topic. For every message sent to that topic, the corresponding Java method is invoked and the payload of the message is delivered as request body. You don't have to poll for messages on the message broker.

1. Add a dependency to the Dapr SDK for Java to the pom.xml in the FineCollectionService directory:

   ```xml
   <dependency>
      <groupId>io.dapr</groupId>
      <artifactId>dapr-sdk-springboot</artifactId>
   </dependency>
   ```

1. Open the file `src-java/FineCollectionService/src/main/java/dapr/fines/violation/ViolationController.java`.

1. Remove the `subscribe` method.

1. Make the type of the `event` parameter a `CloudEvent`, and add an import for `io.dapr.client.domain.CloudEvent`. method with a parameter of type `SpeedingViolation` named `speedingViolaton`; keep the `@RequestBody` annotation in place:

   ```java
   public ResponseEntity<Void> registerViolation(@RequestBody final CloudEvent event) {
   ```

1. Change the code that parses the cloud event data at the beginning of the method:

   ```java
   var data = (Map<String, Object>) event.getData();
   var violation = new SpeedingViolation(
       (String) data.get("licenseNumber"),
       (String) data.get("roadId"),
       (Integer) data.get("excessSpeed"),
       LocalDateTime.parse((String) data.get("timestamp"))
   );
   ```

1. Add an import for the `io.dapr.Topic` class. Add a `@Topic` annotation above the `registerViolation` method to link this method to a topic called `speedingviolations`:

   ```java
   @Topic(name = "speedingviolations", pubsubName = "pubsub")
   ```

   > The *"pubsubName"* argument passed to this attribute refers to the name of the Dapr pub/sub component to use.

1. Open the terminal window in VS Code and make sure the current folder is `src-java/FineCollectionService`.

1. Check all your code-changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you can test the application again. Execute the activities in step 5 again.

