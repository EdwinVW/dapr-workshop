# Assignment 3 - Add pub/sub messaging

In this assignment, you're going to add Dapr **publish/subscribe** messaging to send messages from the TrafficControlService to the FineCollectionService.

## Dapr pub/sub building block

The publish/subscribe pattern allows your microservices to communicate asynchronously with each other purely by sending messages. In this system, the producer of a message sends it to a topic, with no knowledge of what service(s) will consume the message. A message can even be sent if there's no consumer for it.

Similarly, a consumer will receive messages from a topic without knowledge of what producer sent it. This pattern is especially useful when you need to decouple microservices from one another. See the diagram below for an overview of how this pattern works with Dapr:

![](img/pub-sub.png)

For this hands-on assignment, this is all you need to know about this building block. If you want to get more detailed information, read the [overview of this building block](https://docs.dapr.io/developing-applications/building-blocks/pubsub/pubsub-overview/) in the Dapr documentation.

## Assignment goals

To complete this assignment, you must reach the following goals:

1. The TrafficControlService sends `SpeedingViolation` messages using the Dapr pub/sub building block.
2. The FineCollectionService receives `SpeedingViolation` messages using the Dapr pub/sub building block.
3. RabbitMQ is used as pub/sub message broker that runs as part of the solution in a Docker container.

This assignment targets number **2** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

First open the `src` or `src-java` folder in this repo in VS Code. Then open the [Dapr documentation for publish / subscribe](https://github.com/dapr/docs) and start hacking away. Make sure you use the RabbitMQ pub/sub component and spin up a RabbitMQ container to act as message broker.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the step-by-step instructions [for .NET](step-by-step.md) or [.for Java](step-by-step-java.md).

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 4](../Assignment04/README.md).
