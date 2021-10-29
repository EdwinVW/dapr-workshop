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

1. Open the file `TrafficControlService/traffic_control/__init__.py` in VS Code.

1. Inspect the `entrycam` and `exitcam` methods.

And you're done! That's right, you don't need to change anything in order to use an input binding. The thing is that the
binding will invoke exposed API endpoints based on the name of the binding, which you will specify in the component
configuration in one the next steps. As far as the TrafficControlService is concerned, it will just be called over
HTTP and it has no knowledge of Dapr bindings.

## Step 2: Run the Mosquitto MQTT broker

You will use [Mosquitto](https://mosquitto.org/), a lightweight MQTT broker, as the MQTT broker between the simulation and the TrafficControlService. You will run Mosquitto in a Docker container.

In order to connect to Mosquitto, you need to pass in a custom configuration file when starting it. You will create a Docker image that contains the configuration file for the workshop. The folder `Infrastructure/mosquitto` already contains the correct config file you can use.

1. Open the terminal window in VS Code and make sure the current folder is `Infrastructure/mosquitto`.

1. Create the custom Docker image by entering the following command:

   ```console
   docker build -t dapr-trafficcontrol/mosquitto:1.0 .
   ```

1. Check whether the image was created successfully by entering the following command:

   ```console
   docker images
   ```

   You should see that the image is available on your machine:

   ```console
   REPOSITORY                          TAG      IMAGE ID      CREATED       SIZE
   dapr-trafficcontrol/mosquitto:1.0   latest   3875762720a9  2 hours       9.95MB
   ```

1. Start a Mosquitto MQTT broker by entering the following command:

   ```console
   docker run -d -p 1883:1883 -p 9001:9001 --name dtc-mosquitto dapr-trafficcontrol/mosquitto:1.0
   ```

This will start a container based on the `dapr-trafficcontrol/mosquitto:1.0` image. The name of the container will be 
`dtc-mosquitto`. The server will be listening for connections on ports `1883` and `9001` for MQTT traffic.

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

> For your convenience, the `Infrastructure` folder contains Powershell scripts for starting the infrastructural 
> components you'll use throughout the workshop. You can use the `Infrastructure/mosquitto/start-mosquitto.ps1` script to start the Mosquitto container.
>
> If you don't mind starting all the infrastructural containers at once, you can also use the `Infrastructure/start-all.ps1` script.

## Step 3: Configure the input binding

In this step you will add a Dapr binding component configuration file to the custom components folder you created in Assignment 3.

1. Add a new file in the `dapr/components` folder named `entrycam.yaml`.

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

   As you can see, you specify the binding type MQTT (`bindings.mqtt`) and you specify in the `metadata` how to connect
   to the Mosquitto server container you started in step 2 (running on localhost on port `1883`). Also the topic to use
   is configured in metadata: `trafficcontrol/entrycam`. When a MQTT topic is subscribed on by multiple consumers, each
   consumer must specify a unique consumer Id. You can specify this with the `consumerId` field in the `metadata`. Dapr
   automatically replaces the value `"{uuid}"` with a unique Id. In the `scopes` section, you specify that only the
   TrafficControlService should subscribe to the MQTT topic.

Important to note with bindings is the `name` of the binding. This name must be the same as the URI of the API endpoint
you want to be called on your service. In your case this is `/entrycam`.

Now you need to also add an input binding for the `/exitcam` operation:

1. Add a new file in the `dapr/components` folder named `exitcam.yaml`.

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

1. Open the terminal window in VS Code and make sure the current folder is `Simulation`.

1. Add a dependency to the Simulation executing the following command in your terminal:

    ```console
    pip3 install paho-mqtt
    ```

1. Open the file `Simulation/simulation/traffic_simulation/clients.py` file in VS Code.

1. Inspect the code in this file.

This file contains the client that talks to the traffic control service to simulate entry and exit camera events.
We're going to replace the contents of the `send_vehicle_entry` and `send_vehicle_exit` methods to use the MQTT broker
instead of the HTTP endpoint.

1. Replace the content of the `send_vehicle_entry` method with the following code:

   ```python
   self.messaging_adapter.publish("trafficcontrol/entrycam", payload=evt.json())
   ```

  When the `send_vehicle_entry` method is called it will publish the event data on the the entrycam topic of the 
  trafficcontrol service that we configured in the input binding.

1. Replace the content of the `send_vehicle_exit` method with the following code:

   ```python
   self.messaging_adapter.publish("trafficcontrol/exitcam", payload=evt.json())
   ```

1. Add the following lines to the `__init__` method of the `TrafficControlClient` class.

   ```python
   self.messaging_adapter = Client(client_id="simulation")
   self.messaging_adapter.connect("localhost")
   ```

1. Add the following import statement to the top of the file:

   ```python
   from paho.mqtt.client import Client
   ```

Now you're ready to test the application.

## Step 5: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line 
using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the terminal windows).

1. Make sure all the Docker containers introduced in the previous assignments are running (you can use the 
   `Infrastructure/start-all.ps1` script to start them).

1. Open the terminal window in VS Code and make sure the current folder is `VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components -- uvicorn vehicle_registration:app --port 6002
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components -- uvicorn fine_collection:app --port 6001
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components -- uvicorn traffic_control:app --port 6000
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `Simulation`.

1. Start the simulation:

   ```console
   python3 simulation
   ```

You should see the same logs as before.

If you want to know for sure that Mosquitto is used for communication, watch the logs of the Mosquitto server by executing the following command:

```console
docker logs dtc-mosquitto
```

You should see connections being made to the server:

```console
❯ docker logs dtc-mosquitto
1631735130: mosquitto version 2.0.12 starting
1631735130: Config loaded from /mosquitto/config/mosquitto.conf.
1631735130: Opening ipv4 listen socket on port 1883.
1631735130: Opening ipv6 listen socket on port 1883.
1631735130: mosquitto version 2.0.12 running
1631735150: New connection from 172.17.0.1:37348 on port 1883.
1631735150: New connection from 172.17.0.1:37350 on port 1883.
1631735150: New client connected from 172.17.0.1:37350 as simulation (p2, c1, k60).
1631735150: Client simulation already connected, closing old connection.
1631735150: New client connected from 172.17.0.1:37348 as simulation (p2, c1, k60).
1631735150: New connection from 172.17.0.1:37356 on port 1883.
1631735150: Client simulation already connected, closing old connection.
1631735150: New client connected from 172.17.0.1:37356 as simulation (p2, c1, k60).
```

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 7](../Assignment07/README.md).
