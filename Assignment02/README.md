# Assignment 2 - Add Dapr service invocation

In this assignment, you're going to add Dapr into the mix. You will use the Dapr **service invocation** building block.

## Dapr service invocation building block

In a microservices application, it is important to be able to communicate with other services without knowing where they live. Especially when the services are running in Kubernetes (or some other orchestration platform), services can be moved around and replaced with a new version all the time. This is where the Dapr service invocation building block comes in. It works like this:

<img src="img/service-invocation.png" style="zoom: 33%;" />

In Dapr, every service is started with a unique Id (the *app-id*) which can be used the find it. Let's say Service A wants to call Service B.

1. Service A invokes the Dapr service invocation API (using HTTP or gRPC) on its Dapr sidecar and specifies the unique app-id of Service B.
1. Dapr discovers Service B's location using its name-resolution component for the hosting environment the solution is running in.
1. Service A's Dapr sidecar forwards the message to Service B's Dapr sidecar.
1. Service B's Dapr sidecar forwards the request to Service B.  Service B performs its corresponding business logic.
1. Service B returns a response for Service A to its Dapr sidecar.
1. Service B's Dapr sidecar forwards the response to Service A's Dapr sidecar.
1. Service A's Dapr sidecar forwards the response to Service A.

For this hands-on assignment, this is all you need to know about this building block.

> The building block offers way more features like security and load-balancing. Check out the Dapr documentation later to learn all about these additional features.

## Assignment goals

To complete this assignment, you must reach the following goals:

- The VehicleRegistrationService and FineCollectionService are both running with a Dapr sidecar.
- The FineCollectionService uses the Dapr service invocation building block to call the `/vehicleinfo/{licensenumber}` endpoint on the VehicleRegistrationService.

This assignment targets number **1** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

Open the `src` folder in this repo in VS Code. Then open the [Dapr service invocation documentation](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/) and start hacking away. If you need any hints, you may peek in the step-by-step part.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the step-by-step instructions [for .NET](step-by-step.md) or [.for Java](step-by-step-java.md).

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 3](../Assignment03/README.md).
