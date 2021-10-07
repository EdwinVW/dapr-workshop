# Assignment 4 - Add Dapr state management

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControl service saves the state of a vehicle (`VehicleState` class) using the state management building
  block after vehicle entry.
- The TrafficControl service reads and updates the state of a vehicle using the state management
  building block after vehicle exit.

This assignment targets number **3** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Use the Dapr state management building block

First, you need to add something to the state management configuration file:

1. Open the file `dapr/components/statestore.yaml` in VS Code.

1. Add a `scopes` section to the configuration file that specifies that only the TrafficControlService should use the
   state management building block:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: statestore
   spec:
     type: state.redis
     version: v1
     metadata:
     - name: redisHost
       value: localhost:6379
     - name: redisPassword
       value: ""
     - name: actorStateStore
       value: "true"
   scopes:
     - trafficcontrolservice
   ```

Now you will add code to the TrafficControlService so it uses the Dapr state management building block to store vehicle
state:

1. Open the file `TrafficControlService/traffic_control/__init__.py` in VS Code.

2. Inspect the code in the `entrycam` and `exitcam` methods of this controller. The methods refer to a `repository`
   which is defined earlier in the file:

   ```python
   repository = repositories.VehicleStateRepository()
   ```

3. Open the file `TrafficControlService/traffic_control/repositories.py` in VS Code.

   This is the repository used by the TrafficControlService. Inspect the code of this repository. As you can see, this
   repository uses a very simple in-memory key/value map to store the state. The license number of the vehicle is used
   as the key. You are going to replace this implementation with one that uses Dapr state management.

4. Replace the contents of the repositories file with the following code:

    ```python
    import requests
    from . import models


    class VehicleStateRepository:
        def __init__(self):
            self.state = {}

        def get_vehicle_state(self, license_number: str) -> models.VehicleState or None:
            pass

        def set_vehicle_state(self, vehicle_state: models.VehicleState) -> None:
            pass

    ```

5. Replace the contents of the `set_vehicle_state` method with the following contents:

    ```python
    state_entry = [
        dict(key=vehicle_state.license_number, value=vehicle_state.json()),
    ]

    requests.post("http://localhost:3600/v1.0/state/statestore/", json=state_entry)
    ```

    This may look a little cryptic. So let's take a look at what we're doing here. We create a new list of state entries
    to save. The first entry in the list is a dictionary containing two entries, key, and value. The value is the
    data we want to save in the statestore. The key identifies the data that we're storing.

    > Note that you can save multiple state entries with a single request and that the state entry value is a 
    > JSON-serialized version of the state information we want to store.

6. The URL for getting data using the Dapr state API is: 
   `http://localhost:<daprPort>/v1.0/state/<statestore-name>/<key>`. You'll use this API to retrieve the VehicleState.
   Replace the implementation of the `get_vehicle_state` method with the following code:

    ```python
    response = requests.get(f"http://localhost:3600/v1.0/state/statestore/{license_number}")
    return models.VehicleState.parse_raw(response.json())
    ```

The repository code should now look like this:

```python
import requests
from . import models


class VehicleStateRepository:
    def __init__(self):
        self.state = {}

    def get_vehicle_state(self, license_number: str) -> models.VehicleState or None:
        response = requests.get(f"http://localhost:3600/v1.0/state/statestore/{license_number}")

        return models.VehicleState.parse_raw(response.json())

    def set_vehicle_state(self, vehicle_state: models.VehicleState) -> None:
        data = [
            dict(key=vehicle_state.license_number, value=vehicle_state.json()),
        ]

        requests.post("http://localhost:3600/v1.0/state/statestore/", json=data)
```

Now you're ready to test the application.

## Step 2a: Test the application

1. Make sure no services from previous tests are running (close the terminal windows)
2. Make sure all the Docker containers introduced in the previous assignments are running (you can use the
   `Infrastructure/start-all.sh` script to start them).
3. Open the terminal window in VS Code and make sure the current folder is `VehicleRegistrationService`.
4. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components -- uvicorn vehicle_registration:app --port 6002
   ```

5. Open a **new** terminal window in VS Code and change the current folder to `FineCollectionService`.

6. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components -- uvicorn fine_collection:app --port 6001
   ```

7. Open a **new** terminal window in VS Code and change the current folder to `TrafficControlService`.

8. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components -- uvicorn traffic_control:app --port 6000
   ```

9. Open a **new** terminal window in VS Code and change the current folder to `Simulation`.

10. Start the simulation:

    ```console
    python simulation
    ```

You should see similar logging as before.

## Step 2b: Verify the state-store

Obviously, the behavior of the application is exactly the same as before. But are the VehicleState entries actually
stored in the default Redis state-store? To check this, you will use the redis CLI inside the `dapr_redis` container
that is used as state-store in the default Dapr installation.

1. Open a **new** terminal window in VS Code.

2. Execute the following command to start the redis-cli inside the running `dapr_redis` container:

   ```console
   docker exec -it dapr_redis redis-cli
   ```

3. In the redis-cli enter the following command to get the list of keys of items stored in the redis cache:

   ```console
   keys *
   ```

   You should see a list of entries with keys in the form `"trafficcontrolservice||<license-number>"`.

4. Enter the following command in the redis-cli to get the data stored with this key (change the license-number to one
   in the list you see):

   ```console
   hgetall trafficcontrolservice||KL-495-J
   ```

5. You should see something similar to this:

   ```console
   ❯ docker exec -it dapr_redis redis-cli
   127.0.0.1:6379> keys *
   1) "trafficcontrolservice||18-RSS-4"
   2) "trafficcontrolservice||84-GJ-06"
   3) "trafficcontrolservice||KJ-HS-06"
   4) "trafficcontrolservice||JN-TH-23"
   5) "trafficcontrolservice||11-GT-84"
   6) "trafficcontrolservice||RN-KR-35"
   7) "trafficcontrolservice||10-HYD-5"
   8) "trafficcontrolservice||YT-66-PY"
   9) "trafficcontrolservice||ND-841-Y"
   10) "trafficcontrolservice||T-375-NF"
   127.0.0.1:6379> hgetall trafficcontrolservice||ND-841-Y
   1) "version"
   2) "1"
   3) "data"
   4) "{\"licenseNumber\":\"ND-841-Y\",\"entryTimestamp\":\"2021-09-15T11:19:18.1781609+02:00\",\"exitTimestamp\":\"0001-01-01T00:00:00\"}"
   ```

As you can see, the data is actually stored in the redis cache. The cool thing about Dapr is that the state management
building block supports different state-stores through its component model. So without changing any code but only
specifying a different Dapr component configuration, you could use an entirely different storage mechanism.

> If you're up for it, try to swap-out Redis with another state provider. See the 
> [the list of available stores in the Dapr documentation](https://docs.dapr.io/operations/components/setup-state-store/supported-state-stores/)).
> To configure a different state-store, you need to change the file `dapr/components/statestore.yaml`.

## Step 3: Use Dapr state management with the Dapr SDK for Python

In this step you're going to change the `VehicleStateRepository` class and replace calling the Dapr state management
API directly over HTTP with using the `DaprClient` from the Dapr SDK for Python.

1. Open the file `TrafficControlService/traffic_control/repositories.py` in VS Code.

2. Add an import statement to the top of the file for the Dapr client:

   ```python
   from dapr.clients import DaprClient
   ```

3. Replace the the code in the `set_vehicle_state` with the following code:

   ```python
   with DaprClient() as client:
        client.save_state("statestore", vehicle_state.license_number, vehicle_state.json())
   ```

4. Replace the implementation of the `get_vehicle_state` method with the following code:

   ```python
   with DaprClient() as client:
        return models.VehicleState.parse_raw(client.get_state("statestore", license_number).text())
   ```

The repository code should now look like this:

```python
import requests
from . import models
from dapr.clients import DaprClient


class VehicleStateRepository:
    def __init__(self):
        self.state = {}

    def get_vehicle_state(self, license_number: str) -> models.VehicleState or None:
        with DaprClient() as client:
            return models.VehicleState.parse_raw(client.get_state("statestore", license_number).text())

    def set_vehicle_state(self, vehicle_state: models.VehicleState) -> None:
        with DaprClient() as client:
            client.save_state("statestore", vehicle_state.license_number, vehicle_state.json())
```

Now you're ready to test the application. Just repeat steps 2a and 2b.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 5](../Assignment05/README.md).
