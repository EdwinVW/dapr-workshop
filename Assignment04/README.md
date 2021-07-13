# Assignment 4 - Add Dapr state management

In this assignment, you're going to add Dapr **state management** in the TrafficControl service to store vehicle information.

## Dapr State management building block

Dapr offers key/value storage APIs to create stateful, long-running services. Services can use these APIs to leverage any of the supported state stores, without adding or learning a third party SDK.

When using state management, your application will also be able to leverage several other features that would otherwise be complicated and error-prone to build yourself such as:

- Distributed concurrency and data consistency
- Retry policies
- Bulk CRUD operations

See below for a diagram of state management's high level architecture:

<img src="img/state_management.png" style="zoom: 50%;" />

For this hands-on assignment, this is all you need to know about this building block. If you want to get more detailed information, read the [introduction to this building block](https://docs.dapr.io/developing-applications/building-blocks/state-management/) in the Dapr documentation.

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControl service saves the state of a vehicle (`VehicleState` class) using the state management building block after vehicle entry.
- The TrafficControl service reads and updates the state of a vehicle using the state management building block after vehicle exit.

This assignment targets number **3** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

First open the `src` folder in this repo in VS Code. Then open the [Dapr state management documentation](https://docs.dapr.io/developing-applications/building-blocks/state-management/) and start hacking away. Make sure you use the default Redis state-store component provided out of the box by Dapr.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the step-by-step instructions [for .NET](step-by-step.md) or [.for Java](step-by-step-java.md).

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 5](../Assignment05/README.md).
