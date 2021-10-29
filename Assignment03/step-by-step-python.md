# Assignment 3 - Add pub/sub messaging

## Assignment goals

To complete this assignment, you must reach the following goals:

1. The TrafficControlService sends `SpeedingViolation` messages using the Dapr pub/sub building block.

1. The FineCollectionService receives `SpeedingViolation` messages using the Dapr pub/sub building block.

1. RabbitMQ is used as pub/sub message broker that runs as part of the solution in a Docker container.

> Don't worry if you have no experience with RabbitMQ. You will run it as a container in the background and don't
> need to interact with it directly in any way. The instructions will explain exactly how to do that.

This assignment targets number **2** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Run RabbitMQ as message broker

In the example, you will use RabbitMQ as the message broker with the Dapr pub/sub building block. You're going to pull
a standard Docker image containing RabbitMQ to your machine and start it as a container.

1. Open the terminal window in VS Code.

1. Start a RabbitMQ message broker by entering the following command:

   ```powershell
   docker run -d -p 5672:5672 --name dtc-rabbitmq rabbitmq:3-management-alpine
   ```

This will pull the docker image `rabbitmq:3-management-alpine` from Docker Hub and start it. The name of the container
will be `dtc-rabbitmq`. The server will be listening for connections on port `5672` (which is the default port for
RabbitMQ).

If everything goes well, you should see some output like this:

```console
❯ docker run -d -p 5672:5672 --name dtc-rabbitmq rabbitmq:3-management-alpine
Unable to find image 'rabbitmq:3-management-alpine' locally
3-management-alpine: Pulling from library/rabbitmq
a0d0a0d46f8b: Pull complete
31312314eeb3: Pull complete
926937e20d4d: Pull complete
f5676ddf0782: Pull complete
ff9526ce7ab4: Pull complete
6163319fe438: Pull complete
592def0a276e: Pull complete
59922d736a7b: Pull complete
76025ca84b3c: Pull complete
4965e42a5d3c: Pull complete
Digest: sha256:8885c08827289c61133d30be68658b67c6244e517931bb7f1b31752a9fcaec73
Status: Downloaded newer image for rabbitmq:3-management-alpine
85a98f00f1a87b856008fec85de98c8412eb099e3a7675b87945c777b131d876
```

> If you see any errors, make sure you have access to the Internet and are able to download images from Docker Hub.
> See [Docker Hub](https://hub.docker.com/) for more info.

The container will keep running in the background. If you want to stop it, enter the following command:

```powershell
docker stop dtc-rabbitmq
```

You can then start the container later by entering the following command:

```powershell
docker start dtc-rabbitmq
```

If you are done using the container, you can also remove it by entering the following command:

```powershell
docker rm dtc-rabbitmq -f
```

Once you have removed it, you need to start it again with the `docker run` command shown at the beginning of this step.

> For your convenience, the `Infrastructure` folder contains Bash scripts for starting the infrastructural components
> you'll use throughout the workshop. You can use the `Infrastructure/rabbitmq/start-rabbitmq.ps1` script to start
> the RabbitMQ container.
>
> If you don't mind starting all the infrastructural containers at once (also for assignments to come), you can also
> use the `Infrastructure/start-all.ps1` script.

## Step 2: Configure the pub/sub component

Until now, you have been using the Dapr components that are installed by default when you install Dapr on your machine.
These are a state management component and a pub/sub component. They both use the Redis server that is also installed
by default. The components are installed in the folder `%USERPROFILE%\.dapr\components` on Windows
and `$HOME/.dapr/components` on Linux or Mac.

Because you need to change the message broker from Redis to RabbitMQ, you will create a separate folder with the
component configuration files and use this folder when starting the services using the Dapr CLI. You can specify which
folder to use on the command-line with the `--components-path` flag.

1. Create a new folder `dapr/components`.

2. Copy all files from the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on
   Linux or Mac to the `dapr/components` folder.

3. Open the file `dapr/components/pubsub.yaml` in VS Code.

4. Inspect this file. As you can see, it specifies the type of the message broker to use (`pubsub.redis`) and specifies
   information on how to connect to the Redis server in the `metadata` section.

5. Change the content of this file to:

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

As you can see, you specify a different type of pub/sub component (`pubsub.rabbitmq`) and you specify in the
`metadata` how to connect to the RabbitMQ container you started in step 1 (running on localhost on port `5672`).
The other metadata can be ignored for now. In the `scopes` section, you specify that only the TrafficControlService
and FineCollectionService should use the pub/sub building block.

## Step 3: Send messages from the TrafficControlService

With the Dapr pub/sub building block, you use a *topic* to send and receive messages. The producer sends messages to
the topic and one or more consumers subscribe to this topic to receive those messages. First you are going to prepare
the TrafficControlService so it can send messages using Dapr pub/sub.

1. Open the file `TrafficControlService/traffic_control/clients.py` in VS Code.

2. Inside the `collect_fine` method, you find the code that sends a `SpeedingViolation` message to the `collectfine`
   endpoint of the FineCollectionService over HTTP:

   ```python
   request_headers = {
      "Content-Type": "application/json",
      "Accept": "application/json"
   }

   response = requests.post(
      f"{self.base_address}/speedingviolations",
      data=violation.json(),
      headers=request_headers
   )
   ```

   The base_address comes from `TrafficControlService/traffic_control/settings.py` which contains the
   `AppSettings` class. This class loads the data from the file `TrafficControlService/.env`.

3. Open the file `TrafficControlService/.env` in VS Code.

   Here we see the actual value being configured. Inspect the `FINE_COLLECTION_ADDRESS` setting. You can see that in
   the HTTP call, the URL of the VehicleRegistrationService (running on port 6001) is used.

4. The URL for publishing a message using the Dapr pub/sub API is:
   `http://localhost:<daprPort>/v1.0/publish/<pubsub-name>/<topic>`. You'll use this API to send a message to the
   `speedingviolations` topic using the pub/sub component named `pubsub`. The Dapr sidecar for the TrafficControlService
   runs on HTTP port `3600`. Replace the URL in the HTTP call with a call to the Dapr pub/sub API:

   ```shell
   FINE_COLLECTION_ADDRESS=http://localhost:3600/v1.0/publish/pubsub
   ```

That's it. You now use Dapr pub/sub to publish a message to a message broker.

## Step 4: Receive messages in the FineCollectionService (declaratively)

Now you are going to prepare the FineCollectionService so it can receive messages using Dapr pub/sub. Consuming
messages can be done in two ways: *declaratively* (through configuration) or *programmatic* (from the code). First
you'll use the declarative way. Later you'll also use the programmatic way and finally also using the Dapr SDK for
Python.

1. Add a new file in the `dapr/components` folder named `subscription.yaml`.

2. Open this file in VS Code.

3. You're going to define a subscription on a topic and link that to a web API operation on the FineCollectionService.
   Paste this snippet into the file:

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

   The `route` field tells Dapr to forward all messages send to the `speedingviolations` topic to the `/collectfine`
   endpoint in the app. The `scopes` field restricts this subscription to only the service with app-id
   `finecollectionservice` only.

Now your FineCollectionService is ready to receive messages through Dapr pub/sub. But there is a catch! Dapr uses the
[CloudEvents](https://cloudevents.io/) message format for pub/sub. So when we send a message through pub/sub, the
receiving application needs to understand this format and handle the message as a `CloudEvent`. Therefore we need to
change the code slightly. For now we write some code, later we're going to use the Dapr SDK.

1. Open the file `FineCollectionService/fine_collection/__init__.py` in VS Code.

2. Remove the `violation: models.SpeedingViolation` parameter and replace it with `evt_data=Body(...)`.

   After replacing the parameter you should have a method definition that looks 
   like this:

   ```python
   def collect_fine(evt_data=Body(...)) -> Response:
   ```

   You now have access to the incoming HTTP request data including the body of the request that contains the event
   that's sent to the FineCollectionService.

3. Add the following code to the top of the body of the `collect_fine` method to extract the `SpeedingViolation` data
   from the request:

   ```python
   violation = models.SpeedingViolation.parse_raw(evt_data["data"])
   ```

4. Add the following import statement to the top of the file to get the `Body` class.

   ```python
   from fastapi import Body
   ```

5. Save the changes to the file.

6. Open the terminal window in VS Code and make sure the current folder is `FineCollectionService`.

## Step 5: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line
using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the command-shell windows).

1. Open the terminal window in VS Code and make sure the current folder is `VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components -- uvicorn vehicle_registration:app --port 6002
   ```

   > Notice that you specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use RabbitMQ for pub/sub.

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
   python simulation
   ```

You should see the same logs as before. Obviously, the behavior of the application is exactly the same as before.
But if you look closely at the Dapr logs of the FineCollectionService, you should see something like this in there:

```console
INFO[0004] app is subscribed to the following topics: [speedingviolations] through pubsub=pubsub  app_id=finecollectionservice instance=willemm01 scope=dapr.runtime type=log ver=1.2.2
```

So you can see that Dapr has registered a subscription for the FineCollectionService to the `speedingviolations` topic.

## Step 6: Receive messages in the FineCollectionService (programmatic)

The other way of subscribing to pub/sub events is the programmatic way. Dapr will call your service on the well known
endpoint `/dapr/subscribe` to retrieve the subscriptions for that service. You will implement this endpoint and return
the subscription for the `speedingviolations` topic.

1. Stop the FineCollectionService by navigating to its terminal window and pressing `Ctrl-C`. You can keep the other
   services running for now.

2. Open the file `FineCollectionService/fine_collection/__init__.py` in VS Code.

3. Add a new method `subscribe` to the controller that will listen to the route `/dapr/subscribe`:

   ```python
   @app.get("/dapr/subscribe")
   def subscribe():
      subscription = [dict(
         pubsubname="pubsub",
         topic="speedingviolations",
         route="/collectfine"
      )]

      return subscription
   ```

4. Remove the file `dapr/components/subscription.yaml`. This file is not needed anymore because you implemented
   the `/dapr/subscribe` endpoint that we just added to the application.

5. Go back to the terminal window in VS Code and make sure the current folder is `FineCollectionService`.

6. Start the updated FineCollectionService:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components -- uvicorn fine_collection:app --port 6001
   ```

7. After you've looked at the log output and confirmed that everything works, you can stop all the services.

## Step 7: Use Dapr publish / subscribe with the Dapr SDK for Python

In this step, you will change the code slightly so it uses the Dapr SDK for Python. First you'll change the
TrafficControlService that sends messages.

1. Run the following command to install the dapr SDK for python

   ```console
   pip3 install dapr
   ```

2. Open the file `TrafficControlService/traffic_control/clients.py`.

3. Replace the content of the file with the following code:

   ```python
   from . import models
   from dapr.clients import DaprClient


   class FineCollectionClient:
      def __init__(self, base_address: str):
         self.base_address = base_address

      def collect_fine(self, violation: models.SpeedingViolation):
         with DaprClient() as client:
               client.publish_event("pubsub", "speedingviolations", violation.json())

   ```

4. Test the services using the activities in Step 5 of this exercise.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 4](../Assignment04/README.md).
