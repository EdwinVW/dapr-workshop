# Assignment 1 - Run the application

In this assignment, you'll run the application to make sure everything works correctly.

## Assignment goals

To complete this assignment, you must reach the following goals:

- All services are running.
- The logging indicates that all services are working correctly.

As a reminder, this is how the services will interact with each other:

<img src="../img/services.png" style="zoom: 67%;" />

## Step 1. Run the VehicleRegistration service

1. Open the source code folder in VS Code. This guide assumes VS Code, but feel free to use an editor or IDE you're
   comfortable with.

   > Throughout the assignment you can execute all steps in the same instance of editor or IDE window.

2. Open a terminal window.

   > You can do this by using the hotkey ``Ctrl-` `` (Windows) or ``Shift-Ctrl-` `` (macOS).

3. Make sure the current folder is `VehicleRegistrationService`.

4. Run the command `pip3 install -r requirements.txt`
5. Start the service using `uvicorn vehicle_registration:app --port 6002`

> **Note** The `uvicorn` command may not work if you're running on Linux/Ubuntu.
> You can run the command `sudo apt install uvicorn` to make `uvicorn` available on your system.

> If you receive an error here, please double-check whether or not you have installed all the
> [prerequisites](../README.md#Prerequisites) for the workshop! 

Now you can test whether you can call the VehicleRegistrationService. You can do this using a browser, cURL or some
other HTTP client. But there is a convenient way of testing RESTful APIs directly from VS Code (this uses the REST
Client extension VS Code):

1. Open the file `VehicleRegistrationService/test.http` in your editor. The request in this file simulates
   retrieving the vehicle- and owner information for a certain license-number.

2. Click on `Send request` in the file to send a request to the API:

   ![REST client](img/rest-client.png)

3. The response of the request will be shown in a separate window on the right. It should be a response with HTTP
   status code `200 OK` and the body should contain some random vehicle and owner-information:

   ```json
   HTTP/1.1 200 
   Connection: keep-alive
   Content-Type: application/json
   Date: Wed, 16 Jun 2021 19:39:05 GMT
   Keep-Alive: timeout=60
   Transfer-Encoding: chunked
   
   {
       "vehicle_id": "KZ-49-VX",
       "brand": "Toyota",
       "model": "Rav 4",
       "owner_name": "Angelena Fairbairn",
       "owner_email": "angelena.fairbairn@outlook.com"
   }
   ```

4. Check the logging in the terminal window. It should look like this:

   ```console
   > uvicorn vehicle_registration:app --port 6002
   INFO:     Started server process [29384]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:6002 (Press CTRL+C to quit)
   INFO:     127.0.0.1:64855 - "GET /vehicleinfo/KZ-49-VX HTTP/1.1" 200 OK
   ```

## Step 2. Run the FineCollection service

1. Make sure the VehicleRegistrationService service is running (result of step 1).

1. Open a **new** terminal window in VS Code.

   > You can do this by using the hotkey (``Ctrl-` `` on Windows, ``Shift-Ctrl-` `` on macOS) or clicking on
   > the `+` button in the terminal window title bar:
   > ![](img/terminal-new.png)

1. Make sure the current folder is `FineCollectionService`.

1. Run the command `pip3 install -r requirements.txt`

1. Start the service using `uvicorn fine_collection:app --port 6001`.

1. Open the file `FineCollectionService/test.http` in VS Code. The request in this file simulates sending a
   detected speeding-violation to the FineCollectionService.

2. Click on `Execute request` in the file to send a request to the API.

3. The response of the request will be shown in a separate window on the right. It should be a response with HTTP
   status code `200 OK` and no body.

4. Check the logging in the terminal window. It should look like this:

   ```console
   ❯ uvicorn fine_collection:app --port 6001
   INFO:     Started server process [3108]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:6001 (Press CTRL+C to quit)
   INFO:     127.0.0.1:52778 - "POST /collectfine HTTP/1.1" 200 OK
   ```

## Step 3. Run the TrafficControl service

1. Make sure the VehicleRegistrationService and FineCollectionService are running (results of step 1 and 2).

1. Open a **new** terminal window in VS Code and make sure the current folder is `TrafficControlService`.

1. Run the command `pip3 install -r requirements.txt`

1. Start the service using `uvicorn traffic_control:app --port 6000`.

1. Open the `TrafficControlService/test.http` file in VS Code.

1. Click on `Execute request` for all three requests in the file to send two requests to the API.

1. The response of the requests will be shown in a separate window on the right. Both requests should yield a response
   with HTTP status code `200 OK` and no body.

1. Check the logging in the terminal window. It should look like this:

   ```console
   ❯ uvicorn traffic_control:app --port 6000
   INFO:     Started server process [29680]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:6000 (Press CTRL+C to quit)
   INFO:     127.0.0.1:56477 - "POST /entrycam HTTP/1.1" 200 OK
   Vehicle XT-346-Y is over the speed limit. Collecting fine
   INFO:     127.0.0.1:56478 - "POST /exitcam HTTP/1.1" 200 OK
   ```

1. Also inspect the logging of the FineCollectionService.

   > You can do this by selecting another terminal window using the dropdown in the title-bar of the terminal window:
   > ![](img/terminal-dropdown.png)

   You should see the speeding-violation being handled by the FineCollectionService:

   ```console
   ❯ uvicorn fine_collection:app --port 6001
   INFO:     Started server process [8728]
   INFO:     Waiting for application startup.
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:6001 (Press CTRL+C to quit)
   INFO:     127.0.0.1:49916 - "POST /collectfine HTTP/1.1" 200 OK
   ```

## Step 4. Run the simulation

You've tested the APIs directly by using a REST client. Now you're going to run the simulation that actually simulates
cars driving on the highway. The simulation will simulate 3 entry- and exit-cameras (one for each lane).

1. Open a new terminal window in VS Code and make sure the current folder is `Simulation`.

1. Run the command `pip3 install -r requirements.txt`

1. Start the service using `python3 simulation`.

1. In the simulation window you should see something like this:

   ```console
   ❯ python simulation
   Starting agent 0...
   Starting agent 1...
   Starting agent 2...
   Simulation started. Press Ctrl+C to exit.
   Sent car 20-TK-YH into the traffic control system
   Sent car ZD-84-GG into the traffic control system
   Sent car PZ-36-FF into the traffic control system
   ```

1. Also check the logging in all the other Terminal windows. You should see all entry- and exit events and any
   speeding-violations that were detected in the logging.

Now we know the application runs correctly. It's time to start adding Dapr to the application.

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next
assignment. Stopping a service or the simulation is done by pressing `Ctrl-C` in the terminal window. To close the
terminal window, enter the `exit` command.

> You can quickly close a terminal window by clicking on the trashcan icon in its title bar:
> ![](img/terminal-trashcan.png)

Go to [assignment 2](../Assignment02/README.md).
