# Dapr hands-on

This repository contains several hands-on assignments that will introduce you to Dapr. You will start with a simple ASP.NET Core application that contains a number of services. In each assignment, you will change a part of the application so it works with Dapr (or "rub some Dapr on it" as Donovan Brown would say). The Dapr features you will be working with are:

- Service invocation
- State-management
- Publish / Subscribe
- Bindings
- Secrets

For the assignments, you will be using Dapr in stand-alone mode. As a stretch goal, we added a last assignment that will ask you to run the Dapr application on Kubernetes.

## The domain

For the assignments you will be working with a speeding-camera setup as can be found on several Dutch highways. Over the entire length of a certain stretch of highway, the average speed of a vehicle is measured and if it is above the speeding limit on this highway, the driver of the vehicle receives a speeding ticket.

### Overview

This is an overview of the fictitious setup you're simulating:

![Speeding cameras](img/speed-trap-overview.png)

There's 1 entry-camera and 1 exit-camera per lane. When a car passes an entry-camera, the license-number of the car and the timestamp is registered.

When the car passes an exit-camera, this timestamp is also registered by the system. The system then calculates the average speed of the car based on the entry- and exit-timestamp. If a speeding violation is detected, a message is sent to the Central Fine Collection Agency (or CJIB in Dutch). They will retrieve the information of the owner of the vehicle and send him or her a fine.

### Architecture

In order to simulate this in code, the following services are defined:

![Services](img/services.png)

The `src` folder in the repo contains the starting-point for the workshop. It contains a version of the services that use plain HTTP communication and store state in memory. With each assignment of the workshop, you will add a Dapr building-block to the solution. 

- The **Camera Simulation** is a .NET Core console application that will simulate passing cars.
- The **Traffic Control Service** is an ASP.NET Core WebAPI application that offers 2 endpoints: `/entrycam` and `/exitcam`.
- The **Fine Collection Service** is an ASP.NET Core WebAPI application that offers 1 endpoint: `/collectfine` for for collecting fines.
- The **Vehicle Registration Service** is an ASP.NET Core WebAPI application that offers 1 endpoint: `/getvehicleinfo/{license-number}` for getting the vehicle- and owner-information of speeding vehicle.

The way the simulation works is depicted in the sequence diagram below:

<img src="img/sequence.png" alt="Sequence diagram" style="zoom:67%;" />

1. The Camera Simulation generates a random license-number and sends a *VehicleRegistered* message (containing this license-number, a random entry-lane (1-3) and the timestamp) to the `/entrycam` endpoint of the TrafficControlService.
1. The TrafficControlService stores the VehicleState (license-number and entry-timestamp).
1. After some random interval, the Camera Simulation sends a *VehicleRegistered* message to the `/exitcam` endpoint of the TrafficControlService (containing the license-number generated in step 1, a random exit-lane (1-3) and the exit timestamp).
1. The TrafficControlService retrieves the VehicleState that was stored at vehicle entry.
1. The TrafficControlService calculates the average speed of the vehicle using the entry- and exit-timestamp.
1. If the average speed is above the speed-limit, the TrafficControlService calls the `/collectfine` endpoint of the FineCollectionService. The request payload will be a *SpeedingViolation* containing the license-number of the vehicle, the identifier of the road, the speeding-violation in KMh and the timestamp of the violation.
1. The FineCollectionService calculates the fine for the speeding-violation.
1. The FineCollectionSerivice calls the `/vehicleinfo/{license-number}` endpoint of the VehicleRegistrationService with the license-number of the speeding vehicle to retrieve its vehicle- and owner-information.
1. The FineCollectionService sends a fine to the owner of the vehicle by email.

All actions described in this sequence are logged to the console during execution so you can follow the flow.

### End-state with Dapr applied

After completing all the assignments, the architecture has been changed to work with Dapr and should look like this:

<img src="img/dapr-setup.png" alt="Dapr setup" style="zoom:67%;" />

1. For doing request/response type communication between the FineCollectionService and the VehicleRegistrationService, the **service invocation** building-block is used.
1. For communicating messages, the **publish and subscribe** building-block is used. RabbitMQ is used as message broker.
1. For storing the state of a vehicle, the **state management** building-block is used. Redis is used as state store.
1. Fines are sent to the owner of a speeding vehicle by email. For sending the email, the Dapr SMTP **output binding** is used.
1. A Dapr **input binding** for MQTT is used to send simulated car info to the TrafficControlService. Mosquitto is used as MQTT broker.
1. The FineCollectionService needs credentials for connecting to the smtp server. It uses the **secrets management** building block with the local file component to get the credentials.

The sequence diagram below shows how the solution will work with Dapr:

<img src="../dapr-traffic-control/img/sequence-dapr.png" alt="Sequence diagram with Dapr" style="zoom:67%;" />

> If during the workshop you are lost on what the end result of an assignment should be, come back to this README to see the end result.

## Getting started with the workshop

### Prerequisites

Make sure you have the following prerequisites installed on your machine:

- .NET 5 SDK ([download](https://dotnet.microsoft.com/download/dotnet/5.0))
- Visual Studio Code ([download](https://code.visualstudio.com/download)) with at least the following extensions installed:
  - [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp)
  - [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- Git ([download](https://git-scm.com/))
- Docker for desktop ([download](https://www.docker.com/products/docker-desktop))
- Dapr CLI and Dapr runtime ([instructions](https://docs.dapr.io/getting-started/install-dapr-selfhost/))

### Instructions

Every assignment is contained in a separate folder in this repo. Each folder contains the description of the assignment that you can follow.

The `src` folder in the repo contains the starting-point for the workshop. It contains a version of the services that use plain HTTP communication and stores state in memory. With each assignment of the workshop, you will add a Dapr building-block. 

Every description of an assignment (accept the first one) contains two parts with each a certain approach to executing the assignment: a **DIY** part and a **step-by-step** part. The DIY part just states the outcome you need to achieve and no further instructions. It's entirely up to you to achieve the goals with the help of the Dapr documentation. The step-by-step part describes exactly what you need to change in the application step-by-step. It's up to you to pick an approach. If you pick the DIY approach and get stuck, you can always go to the step-by-step approach for some help.

Now it's time for you to get your hands dirty and start with the first assignment started:

1. Clone the Github repository to a local folder on your machine:

   ```
   git clone https://github.com/EdwinVW/dapr-workshop.git
   ```

2. Go to [assignment 1](Assignment01/README.md).

