# Assignment 6 - Add a Dapr input binding

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControlService uses the Dapr MQTT input binding to receive entry- and exit-cam messages over the MQTT protocol.
- The MQTT binding uses the lightweight MQTT message broker Mosquitto that runs as part of the solution in a Docker container.
- The Camera Simulation publishes entry- and exit-cam messages to the MQTT broker.

This assignment targets number **5** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Use the Dapr input binding in the TrafficControlService

You will add code to the TrafficControlService to use the Dapr input MQTT binding to receive entry- and exit-cam messages:

1. Open the file `src-java/TrafficControlService/src/main/java/dapr/traffic/TrafficController.java` in VS Code.

1. Inspect the `vehicleEntry` and `vehicleExit` methods.

And you're done! That's right, you don't need to change anything in order to use an input binding. The thing is that the binding will invoke exposed API endpoints based on the name of the binding, which you will specify in the component configuration in one the next steps. As far as the TrafficControlService is concerned, it will just be called over HTTP and it has no knowledge of Dapr bindings.

## Step 2: Run the Mosquitto MQTT broker

You will use [Mosquitto](https://mosquitto.org/), a lightweight MQTT broker, as the MQTT broker between the simulation and the TrafficControlService. You will run Mosquitto in a Docker container.

In order to connect to Mosquitto, you need to pass in a custom configuration file when starting it. With Docker, you can pass a configuration file when starting a container using a so called *Volume mount*. The folder `src-java/Infrastructure/mosquitto` already contains a config file you can use.

1. Open the terminal window in VS Code and make sure the current folder is `src-java/Infrastructure/mosquitto`.

1. Start a Mosquitto MQTT broker by entering the following command:

    **When running on Windows**:

   ```console
   docker run -d -p 1883:1883 -p 9001:9001 -v $pwd/:/mosquitto/config/ --name dtc-mosquitto eclipse-mosquitto
   ```

   **When running on Mac or Linux**:

   ```console
   docker run -d -p 1883:1883 -p 9001:9001 -v $(pwd)/:/mosquitto/config/ --name dtc-mosquitto eclipse-mosquitto
   ```

This will pull the docker image `eclipse-mosquitto` from Docker Hub and start it. The name of the container will be `dtc-mosquitto`. The server will be listening for connections on port `1883` for MQTT traffic.

The `-v` flag specifies a Docker volume mount. It mounts the current folder (containing the config file) as the ``/mosquitto/config/` folder in the container. Mosquitto reads its config file from that folder.  

If everything goes well, you should see some output like this:

![](img/docker-mosquitto-output.png)

> If you see any errors, make sure you have access to the Internet and are able to download images from Docker Hub. See [Docker Hub](https://hub.docker.com/) for more info.

The container will keep running in the background. If you want to stop it, enter the following command:

```console
docker stop dtc-mosquitto
```

You can then start the container later by entering the following command:

```console
docker start dtc-mosquitto
```

If you are done using the container, you can also remove it by entering the following command:

```console
docker rm dtc-mosquitto -f
```

Once you have removed it, you need to start it again with the `docker run` command shown at the beginning of this step.

> For your convenience, the `src-java/Infrastructure` folder contains Bash scripts for starting the infrastructural components you'll use throughout the workshop. You can use the `src-java/Infrastructure/mosquitto/start-mosquitto.sh` script to start the Mosquitto container.
>
> If you don't mind starting all the infrastructural containers at once, you can also use the `src/Infrastructure/start-all.sh` script.

## Step 3: Configure the input binding

In this step you will add a Dapr binding component configuration file to the custom components folder you created in Assignment 3.

1. Add a new file in the `src-java/dapr/components` folder named `entrycam.yaml`.

1. Open the file in VS Code.

1. Paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: entrycam
     namespace: dapr-trafficcontrol
   spec:
     type: bindings.mqtt
     version: v1
     metadata:
     - name: url
       value: mqtt://localhost:1883
     - name: topic
       value: trafficcontrol/entrycam
     - name: consumerID
       value: "{uuid}"
   scopes:
     - trafficcontrolservice
   ```

   As you can see, you specify the binding type MQTT (`bindings.mqtt`) and you specify in the `metadata` how to connect to the Mosquitto server container you started in step 2 (running on localhost on port `1883`). Also the topic to use is configured in metadata: `trafficcontrol/entrycam`. When a MQTT topic is subscribed on by multiple consumers, each consumer must specify a unique consumer Id. You can specify this with the `consumerId` field in the `metadata`. Dapr automatically replaces the value `"{uuid}"` with a unique Id. In the `scopes` section, you specify that only the TrafficControlService should subscribe to the MQTT topic.

Important to note with bindings is the `name` of the binding. This name must be the same as the URI of the API endpoint you want to be called on your service. In your case this is `/entrycam`.

Now you need to also add an input binding for the `/exitcam` operation:

1. Add a new file in the `src-java/dapr/components` folder named `exitcam.yaml`.

1. Open this file in VS Code.

1. Paste this snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: exitcam
     namespace: dapr-trafficcontrol
   spec:
     type: bindings.mqtt
     version: v1
     metadata:
     - name: url
       value: mqtt://localhost:1883
     - name: topic
       value: trafficcontrol/exitcam
     - name: consumerID
       value: "{uuid}"
   scopes:
     - trafficcontrolservice
   ```

Now your input bindings are configured and it's time to change the Camera Simulation so it will send MQTT messages to Mosquitto.

## Step 4: Send MQTT messages from the Camera Simulation

In this step you change the Camera Simulation so it sends MQTT messages instead of doing HTTP requests:

1. Open the terminal window in VS Code and make sure the current folder is `src-java/Simulation`.

1. Add a dependency to the Simulation by opening it's **pom.xml** add adding the following snippet inside the `<dependencies>` tag:

    ```xml
    <dependency>
        <groupId>org.springframework.integration</groupId>
        <artifactId>spring-integration-mqtt</artifactId>
    </dependency>
    ```

   Notice how you do not have to specify the version for this dependency. The Spring Integration Bill of Materials declares a version that is compatible with the Spring version that we use.

1. Open the file `src-java/Simulation/src/main/java/dapr/simulation/Simulation.java` file in VS Code.

1. Inspect the code in this file.

As you can see, the simulation gets an `TrafficControlService` instance injected in its constructor. This is the proxy that is used by the simulation to send entry- and exit-cam messages to the TrafficControlService.

1. Open the file `src-java/Simulation/src/main/java/dapr/simulation/HttpTrafficControlService.java` in VS Code and inspect the code.

The proxy uses HTTP to send the message to the TrafficControlService. You will replace this now with an implementation that uses MQTT.

1. Add a new file in the `src-java/Simulation/src/main/java/dapr/simulation/` folder named `MqttTrafficControlService.java`. Paste the following code into this file:

   ```java
   package dapr.simulation;

   import dapr.simulation.events.VehicleRegistered;
   import org.springframework.integration.dsl.IntegrationFlow;
   import org.springframework.messaging.support.GenericMessage;

   public class MqttTrafficControlService implements TrafficControlService {
       private final IntegrationFlow entryCamera;
       private final IntegrationFlow exitCamera;

       public MqttTrafficControlService(final IntegrationFlow entryCamera, final IntegrationFlow exitCamera) {
           this.entryCamera = entryCamera;
           this.exitCamera = exitCamera;
       }

       @Override
       public void sendVehicleEntry(final VehicleRegistered event) {
           entryCamera.getInputChannel().send(new GenericMessage<>(event));
       }

       @Override
       public void sendVehicleExit(final VehicleRegistered event) {
           exitCamera.getInputChannel().send(new GenericMessage<>(event));
       }
   }
   ```

1. Inspect the code. The `IntegrationFlow` instances are integration flows which you will configure using the Spring Integration Framework. Those flows provide an input channel that you use to publish messages, which are simple wrappers about around the existing events. 

1. Also create a new file `MqttConfiguration.java` in the `src-java/Simulation/src/main/java/dapr/simulation/` folder. Add the following content into this file:

  ```java
   package dapr.simulation;

   import org.springframework.context.annotation.Bean;
   import org.springframework.context.annotation.Configuration;
   import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;
   import org.springframework.integration.annotation.IntegrationComponentScan;
   import org.springframework.integration.dsl.IntegrationFlow;
   import org.springframework.integration.dsl.IntegrationFlows;
   import org.springframework.integration.dsl.Transformers;
   import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
   import org.springframework.integration.support.json.Jackson2JsonObjectMapper;
   import org.springframework.messaging.MessageHandler;

   import java.util.Map;

   @Configuration
   @IntegrationComponentScan
   public class MqttConfiguration {
       @Bean
       public IntegrationFlow entryCamera(final Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder) {
           var mapper = jacksonObjectMapperBuilder.build();
           return IntegrationFlows.from("trafficcontrol/entrycam")
                   .transform(Transformers.toJson(new Jackson2JsonObjectMapper(mapper)))
                   .enrichHeaders(Map.of("mqtt_topic", "trafficcontrol/entrycam"))
                   .handle(mqttOutbound())
                   .get();
       }

       @Bean
       public IntegrationFlow exitCamera(final Jackson2ObjectMapperBuilder jacksonObjectMapperBuilder) {
           var mapper = jacksonObjectMapperBuilder.build();
           return IntegrationFlows.from("trafficcontrol/exitcam")
                   .transform(Transformers.toJson(new Jackson2JsonObjectMapper(mapper)))
                   .enrichHeaders(Map.of("mqtt_topic", "trafficcontrol/exitcam"))
                   .handle(mqttOutbound())
                   .get();
       }

       @Bean
       public MessageHandler mqttOutbound() {
           var handler = new MqttPahoMessageHandler("tcp://localhost:1883", "simulation");
           handler.setAsync(true);
           return handler;
       }
   }
   ```

1. Inspect the code. This Spring configuration class declares the two `IntegrationFlow` instances. They are very much alike: both of them convert an incoming message to JSON, add a header that in turn will be translated to an MQTT topic and finally hand the messages over to the MQTT client.

1. Open the file `src-java/Simulation/src/main/java/dapr/simulation/SimulationConfiguration.java` and replace the method `trafficControlService` with the following snippet:

  ```java
  @Bean
  public TrafficControlService trafficControlService(final IntegrationFlow entryCamera, final IntegrationFlow exitCamera) {
      return new MqttTrafficControlService(entryCamera, exitCamera);
  }
  ```

1. Open the terminal window in VS Code and make sure the current folder is `src-java/Simulation`.

1. Check all your code changes are correct by building the code. Execute the following command in the terminal window:

   ```console
   mvn package
   ```

   If you see any warnings or errors, review the previous steps to make sure the code is correct.

Now you're ready to test the application.

## Step 5: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the terminal windows).

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

You should see the same logs as before.

If you want to know for sure that Mosquitto is used for communication, watch the logs of the Mosquitto server by executing the following command:

```console
docker logs dtc-mosquitto
```

You should see connections being made to the server:

![](img/mosquitto-logging.png)

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 7](../Assignment07/README.md).
