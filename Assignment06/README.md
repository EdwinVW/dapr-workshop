# Assignment 6 - Add a Dapr input binding

In this assignment, you're going to add a Dapr **input binding** in the TrafficControlService to receive entry- and exit-cam messages over the MQTT protocol.

## Dapr bindings

In this assignment you're going to focus on Dapr input bindings. See below for a diagram of how input bindings work:

<img src="img/input-binding.png" style="zoom: 50%;" />

For this hands-on assignment, this is all you need to know about input bindings. If you want to get more detailed information, read the [introduction to this building block](https://docs.dapr.io/developing-applications/building-blocks/bindings/) in the Dapr documentation.

## Assignment goals

To complete this assignment, you must reach the following goals:

- The TrafficControlService uses the Dapr MQTT input binding to receive entry- and exit-cam messages over the MQTT protocol.
- The MQTT binding uses the lightweight MQTT message broker Mosquitto that runs as part of the solution in a Docker container.
- The Camera Simulation publishes entry- and exit-cam messages to the MQTT broker.

This assignment targets number **5** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

Open the source code folder in VS Code. Then open the [Bindings documentation](https://docs.dapr.io/developing-applications/building-blocks/bindings/) and start hacking away. As MQTT broker, you can use the lightweight MQTT broker [Mosquitto](https://mosquitto.org/).

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the step-by-step instructions:

- [for .NET](step-by-step.md)
- [for Java](step-by-step-java.md)
- [for Python](step-by-step-python.md)

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 7](../Assignment07/README.md).
