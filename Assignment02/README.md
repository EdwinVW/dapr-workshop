# Assignment 2 - Add Dapr service-to-service invocation

In this assignment, you're going to add Dapr into the mix. You will use the **Service-to-service Invocation** building-block.

## Dapr Service-to-service invocation building block

In a microservices application, it is important to be able to communicate with other services without knowing where they live. Especially when the services are running in Kubernetes (or some other orchestration platform), services can be moved around and replaced with a new version all the time. This is where the Dapr service-to-service building block comes in. It works like this:

![](img/service-invocation.png)

1. Service A makes a http/gRPC call meant for Service B.  The call goes to the local Dapr sidecar.
2. Dapr discovers Service B's location and forwards the message to Service B's Dapr sidecar
3. Service B's Dapr sidecar forwards the request to Service B.  Service B performs its corresponding business logic.
4. Service B sends a response for Service A.  The response goes to Service B's sidecar.
5. Dapr forwards the response to Service A's Dapr sidecar.
6. Service A receives the response.

For this hands-on assignment, this is all you need to know about this building-block. If you want to get more detailed information, read the [introduction to this building-block](https://github.com/dapr/docs/blob/master/concepts/service-invocation/README.md) in the Dapr documentation.

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The Government service is started running Dapr.
- The TrafficControl service uses the Dapr client for .NET to call the GetVehicleInfo method on the Government service using a Dapr direct service-to-service invocation.

## DIY instructions

First open the `Assignment 2` folder in this repo in VS Code. Then open the [Dapr documentation](https://github.com/dapr/docs) and start hacking away. Make sure the Government service is using `50001` as the dapr-grpc-port. If you need any hints, you may peek in the step-by-step part.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the [step-by-step instructions](step-by-step.md).

## Next assignment

Make sure you stop all running processes before proceeding to the next assignment.

Go to [assignment 3](../Assignment03/README.md).
