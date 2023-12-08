# Dapr workshop

This repository contains several hands-on assignments that will introduce you to Dapr. You will start with a simple microservices application that contains a number of services. In each assignment, you will change a part of the application so it works with Dapr (or "rub some Dapr on it" as Donovan Brown would say). The Dapr building blocks you will be working with are:

- Service invocation
- State-management
- Publish / Subscribe
- Bindings
- Secrets management

Because Dapr can be used from several programming languages, we added 3 versions of the hands-on assignments to the workshop:

- C# (.NET)
- Java
- Python

Before starting the workshop, please choose a language you want to use and follow the instructions for that language.
You will be using Dapr in self-hosted mode.

## The domain

For the assignments you will be working with a speeding-camera setup as can be found on several Dutch highways. This is an overview of the fictitious setup you're simulating:

![Speeding cameras](img/speed-trap-overview.png)

There's 1 entry-camera and 1 exit-camera per lane. When a car passes an entry-camera, the license-number of the car and the timestamp is registered.

When the car passes an exit-camera, this timestamp is also registered by the system. The system then calculates the average speed of the car based on the entry- and exit-timestamp. If a speeding violation is detected, a message is sent to the Central Fine Collection Agency (or CJIB in Dutch). They will retrieve the information of the owner of the vehicle and send him or her a fine.

### Architecture

In order to simulate this in code, the following services are defined:

![Services](img/services.png)

- The **Camera Simulation** simulates passing cars.
- The **Traffic Control Service** offers 2 HTTP endpoints: `/entrycam` and `/exitcam`. These endpoints can be used simulate a car passing the entry- or exit-cam.
- The **Fine Collection Service** offers 1 HTTP endpoint: `/collectfine` for collecting fines.
- The **Vehicle Registration Service** offers 1 HTTP endpoint: `/getvehicleinfo/{license-number}` for getting the vehicle- and owner-information of a vehicle.

The way the simulation works is depicted in the sequence diagram below:

<img src="img/sequence.png" alt="Sequence diagram" style="zoom:67%;" />

1. The Camera Simulation generates a random license-number and sends a *VehicleRegistered* message (containing this license-number, a random entry-lane (1-3) and the timestamp) to the `/entrycam` endpoint of the TrafficControlService.
2. The TrafficControlService stores the *VehicleState* (license-number and entry-timestamp).
3. After some random interval, the Camera Simulation sends a *VehicleRegistered* message to the `/exitcam` endpoint of the TrafficControlService (containing the license-number generated in step 1, a random exit-lane (1-3) and the exit timestamp).
4. The TrafficControlService retrieves the *VehicleState* that was stored at vehicle entry.
5. The TrafficControlService calculates the average speed of the vehicle using the entry- and exit-timestamp. It also stores the *VehicleState* with the exit timestamp for audit purposes, but this is left out of the sequence diagram for clarity.
6. If the average speed is above the speed-limit, the TrafficControlService calls the `/collectfine` endpoint of the FineCollectionService. The request payload will be a *SpeedingViolation* containing the license-number of the vehicle, the identifier of the road, the speeding-violation in KMh and the timestamp of the violation.
7. The FineCollectionService calculates the fine for the speeding-violation.
8. The FineCollectionSerivice calls the `/vehicleinfo/{license-number}` endpoint of the VehicleRegistrationService with the license-number of the speeding vehicle to retrieve its vehicle- and owner-information.
9. The FineCollectionService sends a fine to the owner of the vehicle by email.

All actions described in this sequence are logged to the console during execution so you can follow the flow.

### End-state with Dapr applied

After completing all the assignments, the architecture has been changed to work with Dapr and should look like this:

<img src="img/dapr-setup.png" alt="Dapr setup" style="zoom:67%;" />

1. For doing request/response type communication between the FineCollectionService and the VehicleRegistrationService, the **service invocation** building block is used.
1. For sending speeding violations to the FineCollectionService, the **publish and subscribe** building block is used. RabbitMQ is used as message broker.
1. For storing the state of a vehicle, the **state management** building block is used. Redis is used as state store.
1. Fines are sent to the owner of a speeding vehicle by email. For sending the email, the Dapr SMTP **output binding** is used.
1. The Dapr **input binding** for MQTT is used to send simulated car info to the TrafficControlService. Mosquitto is used as MQTT broker.
1. The FineCollectionService needs credentials for connecting to the smtp server and a license key for a fine calculator component. It uses the **secrets management** building block with the local file component to get the credentials and the license key.

The sequence diagram below shows how the solution will work with Dapr:

<img src="img/sequence-dapr.png" alt="Sequence diagram with Dapr" style="zoom:67%;" />

> If during the workshop you are lost on what the end result of an assignment should be, come back to this README to see the end result.

## Getting started with the workshop

### Prerequisites

In order to get most value out of the workshop, make sure you have the prerequisites installed on your machine before the workshop starts. Install the General prerequisites first. Then, select the technology stack you are going to use for executing the workshop assignments and install the prerequisites for that technology stack.

#### General

- Git ([download](https://git-scm.com/))
- Visual Studio Code ([download](https://code.visualstudio.com/download)) with at least the following extensions installed:
  - [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)
- Docker for desktop ([download](https://www.docker.com/products/docker-desktop))
- [Install the Dapr CLI](https://docs.dapr.io/getting-started/install-dapr-cli/) and [initialize Dapr locally](https://docs.dapr.io/getting-started/install-dapr-selfhost/)

All scripts in the instructions are PowerShell scripts. If you're working on a Mac, it is recommended to install PowerShell for Mac:

- PowerShell for Mac ([instructions](https://docs.microsoft.com/nl-nl/powershell/scripting/install/installing-powershell-core-on-macos?view=powershell-7.1))

#### .NET

For the .NET assignments:

- .NET 8 SDK ([download](https://dotnet.microsoft.com/download/dotnet/8.0))
- [C# extension for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp)

#### Java

For the Java assignments:

- Java 17 or above ([download](https://adoptopenjdk.net/?variant=openjdk17))
- [Visual Studio Code Extension Pack for Java](https://marketplace.visualstudio.com/items?itemName=vscjava.vscode-java-pack)
- Apache Maven 3.6.3 or above is required; Apache Maven 3.8.1 is advised ([download](http://maven.apache.org/download.cgi))
  - Make sure that Maven uses the correct Java runtime by running `mvn -version`.

#### Python

For the Python assignments:

- Python 3.9 ([download](https://www.python.org/downloads/))
- Python Extension for Visual Studio Code ([download](https://marketplace.visualstudio.com/items?itemName=ms-python.python))

### Versions

The workshop has been tested with the following versions:

| Attribute                   | Details              |
| --------------------------- | -------------------- |
| Dapr runtime version        | v1.12               |
| Dapr CLI version            | v1.12               |
| .NET version                | .NET 8              |
| Java version                | Java 16              |
| Python version              | 3.9.6                |
| Dapr SDK for .NET version   | v1.12.0               |
| Dapr SDK for Java version   | v1.3.0               |
| Dapr SDK for Python version | v1.3.0               |

### Instructions

Every assignment is contained in a separate folder in this repo. Each folder contains the description of the assignment that you can follow.

**It is important you work through all the assignments in order and don't skip any assignments. The instructions for each assignment rely on the fact that you have finished the previous assignments successfully.**

You will be provided with a starting point for the workshop. This starting point is a working version of application in which the services use plain HTTP to communicate with each-other and state is stored in memory. With each assignment of the workshop, you will add a Dapr building block to the solution.

Every assignment offers instructions on how to complete the assignment. With the exception of assignment 1, each assignment offers two versions of the instructions: the **DIY** version and the **step-by-step** version. The DIY version just states the outcome you need to achieve and no further instructions. It's entirely up to you to achieve the goals with the help of the Dapr documentation. The step-by-step version describes exactly what you need to change in the application step-by-step. It's up to you to pick an approach. If you pick the DIY approach and get stuck, you can always go to the step-by-step instructions for some help.

#### Integrated terminal

During the workshop, you should be working in 1 instance of VS Code. You will use the integrated terminal in VS Code extensively. All terminal commands have been tested on a Windows machine with the integrated Powershell terminal in VS Code. If you have any issues with the commands on Linux or Mac, please create an issue or a PR to add the appropriate command.

#### Prevent port collisions

During the workshop you will run the services in the solution on your local machine. To prevent port-collisions, all services listen on a different HTTP port. When running the services with Dapr, you need additional ports for HTTP and gRPC communication with the sidecars. By default these ports are `3500` and `50001`. But to prevent confusion, you'll use totally different port numbers in the assignments. If you follow the instructions, the services will use the following ports for their Dapr sidecars to prevent port collisions:

| Service                    | Application Port | Dapr sidecar HTTP port | Dapr sidecar gRPC port |
|----------------------------|------------------|------------------------|------------------------|
| TrafficControlService      | 6000             | 3600                   | 60000                  |
| FineCollectionService      | 6001             | 3601                   | 60001                  |
| VehicleRegistrationService | 6002             | 3602                   | 60002                  |

If you're doing the DIY approach, make sure you use the ports specified in the table above.

The ports can be specified on the command-line when starting a service with the Dapr CLI. The following command-line flags can be used:

- `--app-port`
- `--dapr-http-port`
- `--dapr-grpc-port`

If you're on Windows with Hyper-V enabled, you might run into an issue that you're not able to use one (or more) of these ports. This could have something to do with aggressive port reservations by Hyper-V. You can check whether or not this is the case by executing this command:

```powershell
netsh int ipv4 show excludedportrange protocol=tcp
```

If you see one (or more) of the ports shown as reserved in the output, fix it by executing the following commands in an administrative terminal:

```powershell
dism.exe /Online /Disable-Feature:Microsoft-Hyper-V
netsh int ipv4 add excludedportrange protocol=tcp startport=6000 numberofports=3
netsh int ipv4 add excludedportrange protocol=tcp startport=3600 numberofports=3
netsh int ipv4 add excludedportrange protocol=tcp startport=60000 numberofports=3
dism.exe /Online /Enable-Feature:Microsoft-Hyper-V /All
```

#### Running self-hosted on MacOS with Antivirus software

Some antivirus software blocks mDNS (we've actually encountered this with Sophos). mDNS is used for name-resolution by Dapr when running in self-hosted mode. Blocking mDNS will cause issues with service invocation. When you encounter any errors when invoking services using service invocation, use Consul as an alternative name resolution service.

When starting the services, use the `dapr/config/consul-config.yaml` config file. This config file configures Dapr to use Consul for name resolution. You can use the `--config` command-line argument to specify the config file to use:

```bash
❯ dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --config ../dapr/config/consul-config.yaml dotnet run
```

You can find a line in the Dapr logging that indicates the naming service used:

```bash
ℹ️  Starting Dapr with id vehicleregistrationservice. HTTP Port: 3602. gRPC Port: 60002
...
INFO[0000] Initialized name resolution to consul app_id=vehicleregistrationservice instance=192.168.2.16 scope=dapr.runtime type=log ...
...
```

#### Getting started

Now it's time for you to get your hands dirty and start with the first assignment. The source code that contains the starting point for the workshop is situated in a different repository. There is a separate repository for each of the programming languages that the workshop is available in:

- C#: [https://github.com/EdwinVW/dapr-workshop-csharp](https://github.com/EdwinVW/dapr-workshop-csharp)
- Java: [https://github.com/mthmulders/dapr-workshop-java](https://github.com/mthmulders/dapr-workshop-java)
- Python: [https://github.com/wmeints/dapr-workshop-python](https://github.com/wmeints/dapr-workshop-python)

Follow the instructions below to get started:

1. Clone the source code repository for the programming language you want to use to a local folder on your machine. For example:

   ```console
   git clone https://github.com/EdwinVW/dapr-workshop-csharp.git
   ```

   **From now on, this folder is referred to as the 'source code' folder.**

2. Before starting with the assignments, I suggest you check out the code of the different services. All folders used in the assignments are specified relative to the root of the source code folder.

3. Start with [assignment 1](Assignment01/README.md).

## Dapr for .NET Developers

If you want to learn more about Dapr after doing the workshop, you can read the book "Dapr for .NET developers" that was co-authored by the creators of this workshop. Although the book is targeted at .NET developers, it covers all the concepts and generic APIs of Dapr. So it should also be useful for developers that use a different technology stack.

[Dowload the PDF](https://aka.ms/dapr-ebook)
[Read it online](https://docs.microsoft.com/dotnet/architecture/dapr-for-net-developers/?WT.mc_id=DT-MVP-5001823)

![Dapr for .NET Developers](img/dapr-for-net-devs-cover-thumb.png)
