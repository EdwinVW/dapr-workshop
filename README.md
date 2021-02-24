# Dapr hands-on

This repository contains several hands-on assignments that will introduce you to Dapr. You will start with a simple ASP.NET Core application that contains a number of services. In each assignment, you will change a part of the application so it works with Dapr (or "rub some Dapr on it" as Donovan Brown would say). The Dapr features you will be working with are:

- Service invocation
- State-management
- Publish / Subscribe
- Secrets

For the assignments, you will be using Dapr in stand-alone mode. As a stretch goal, we added a last assignment that will ask you to run the Dapr application on Kubernetes.

## The domain

For the assignments you will be working with a speeding-camera setup as can be found on several Dutch highways. Over the entire length of a certain stretch of highway, the average speed of a vehicle is measured and if it is above the speeding limit on this highway, the driver of the vehicle receives a speeding ticket.

### Overview

This is an overview of the fictitious setup you're simulating:

![](img/speed-trap-overview.png)

There's 1 entry-camera and 1 exit-camera per lane. When a car passes an entry-camera, the license-number of the car is registered.

In the background, information about the vehicle  is retrieved from the Department Of Motor-vehicles - DMV (or RDW in Dutch) by calling their web-service.

When the car passes an exit-camera, this is registered by the system. The system then calculates the average speed of the car based on the entry- and exit-timestamp. If a speeding violation is detected, a message is sent to the Central Judicial Collection Agency - CJCA (or CJIB in Dutch) will send a speeding-ticket to the driver of the vehicle.

### Architecture

In order to simulate this in code, the following services are available:

![](img/services.png)

- The **Simulation** is a .NET Core console application that will simulate passing cars.
- The **TrafficControlService** is an ASP.NET Core WebAPI application that offers 2 endpoints: *Entrycam* and *ExitCam*.
- The **Government** service is an ASP.NET Core WebAPI application that offers 2 endpoints: *RDW* (for retrieving vehicle information) and *CJIB* (for sending speeding tickets).

The way the simulation works is depicted in the sequence diagram below:

![](img/sequence.png)

1. The **Simulation** generates a random license-number and sends a *VehicleRegistered* message (containing this license-number, a random entry-lane (1-3) and the timestamp) to the *EntryCam* endpoint of the **TrafficControlService**.
2. The **TrafficControlService** calls the *RDW* endpoint of the **GovernmentService** to retrieve the brand and model of the vehicle corresponding to the license-number.
3. The **TrafficControlService** stores the VehicleState (vehicle information and entry-timestamp) in the state-store.
4. After some random interval, the **Simulation** sends a *VehicleRegistered* message to the *ExitCam* endpoint of the **TrafficControlService** (containing the license-number generated in step 1, a random exit-lane (1-3) and the exit timestamp).
5. The **TrafficControlService** retrieves the VehicleState from the state-store.
6. The **TrafficControlService** calculates the average speed of the vehicle using the entry- and exit-timestamp.
7. If the average speed is above the speed-limit, the **TrafficControlService** will sent a *SpeedingViolationDetected* message (containing the license-number of the vehicle, the identifier of the road, the speeding-violation in KMh and the timestamp of the violation) to the *CJIB* endpoint of the **GovernmentService**.
8. The **GovernmentService** calculates the fine for the speeding-violation and simulates sending a speeding-ticket to the owner of the vehicle.

All actions described in this sequence are logged to the console during execution so you can follow the flow.

### End-state

After completing all the assignments, the architecture has been changed to work with Dapr. For communicating messages, the **publish and subscribe** building-block is used. For doing request/response type communication with a service, the  **service-to-service invocation** building-block is used. And for storing the state of a vehicle, the **state management** building-block is used.

![](img/dapr-setup.png)

In the assignments, the Redis component is used for both state management as well as for pub/sub.

## Getting started

### Prerequisites

Make sure you have the following prerequisites installed on your machine:

- .NET Core 3.1 ([download](https://dotnet.microsoft.com/download/dotnet-core/3.1))
- Visual Studio Code ([download](https://code.visualstudio.com/download))
- Docker for desktop ([download]())
- Dapr CLI 1.0.0 RC2 ([download](https://github.com/dapr/cli/releases/tag/v1.0.0-rc.2))
- Dapr Runtime 1.0.0 RC2

### Install Dapr

If you haven't installed Dapr stand-alone yet on your machine, first do that. If you already installed it, you can skip this.

1. Make sure you have installed all prerequisites and docker for desktop is running on your machine.

2. Open a new command-shell window.

3. enter the following command:

   ```
   dapr init --runtime-version 1.0.0-rc.2
   ```

4. Check the logging for errors.

### Instructions

Every assignment is contained in a separate folder in this repo. Each folder contains the description of the assignment that you can follow. The folder also contains the starting-point of the application as if the previous assignment was executed correctly.

Every description of an assignment (accept the first one) contains two parts with each a certain approach to executing the assignment: a **DIY** part and a **step-by-step** part. The DIY part just states the outcome you need to achieve and no further instructions. It's entirely up to you to achieve the goals with the help of the Dapr documentation. The step-by-step part describes exactly what you need to change in the application step-by-step. It's up to you to pick an approach. If you pick the DIY approach and get stuck, you can always go to the step-by-step approach for some help.

Now it's time for you to get your hands dirty and start with the first assignment started:

1. Clone the Github repository with all the assignments to a local folder on your machine:

   ```
   git clone https://github.com/EdwinVW/dapr-hands-on.git
   ```

2. Go to [assignment 1](Assignment01/README.md).
