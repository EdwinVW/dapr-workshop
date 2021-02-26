# Assignment 2 - Add Dapr Service invocation

In this assignment, you're going to add Dapr into the mix. You will use the **Service invocation** building-block.

## Dapr Service invocation building block

In a microservices application, it is important to be able to communicate with other services without knowing where they live. Especially when the services are running in Kubernetes (or some other orchestration platform), services can be moved around and replaced with a new version all the time. This is where the Dapr service-to-service building block comes in. It works like this:

<img src="img/service-invocation.png" style="zoom: 33%;" />

1. Service A makes an HTTP or gRPC call meant for Service B.  The call goes to Service A's Dapr sidecar.
2. Dapr discovers Service B's location using its name-resolution component for the hosting environment the solution is running in. 
3. Service A's sidecar forwards the message to Service B's Dapr sidecar.
4. Service B's Dapr sidecar forwards the request to Service B.  Service B performs its corresponding business logic.
5. Service B returns a response for Service A to its sidecar.
6. Dapr forwards the response to Service A's Dapr sidecar.
7. Service A's sidecar forwards the response to Service A.

For this hands-on assignment, this is all you need to know about this building-block. 

> The building block offers way more features like security and load-balancing. Check out the Dapr documentation later for learning all about these additional features.

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The VehicleRegistrationService and FineCollectionService are running with Dapr.
- The FineCollectionService uses the Dapr client for .NET to call the `/vehicleinfo/{licensenumber}` endpoint on the VehicleRegistrationService using Dapr service invocation.

This is number **1** in the end-state setup:

<img src="../../dapr-traffic-control/img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

Open the `src` folder in this repo in VS Code. Then open the [Dapr service invocation documentation](https://docs.dapr.io/developing-applications/building-blocks/service-invocation/) and start hacking away. If you need any hints, you may peek in the step-by-step part.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the [step-by-step instructions](step-by-step.md).

## Next assignment

Make sure you stop all running processes before proceeding to the next assignment.

Go to [assignment 3](../Assignment03/README.md).
