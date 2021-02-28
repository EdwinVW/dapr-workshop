# Assignment 6 - Add a Dapr input binding

In this assignment, you're going to add a Dapr **input binding** in the TrafficControlService to receive entry- and exit-cam messages over the MQTT protocol.

## Dapr bindings

Dapr offers the bindings building block to easily interface with external systems. Bindings are divided into input bindings and output bindings. Input bindings can trigger your services by picking events coming in from external systems. Output bindings are an easy way to invoke functionality of some external system. Both input and output bindings do this without you as a developer having to learn the API or SDK of the external system. You only need to know the Dapr bindings API. See below for a diagram of how input bindings work:

<img src="img/input-binding.png" style="zoom: 50%;" />

For this hands-on assignment, this is all you need to know about output bindings. If you want to get more detailed information, read the [introduction to this building block](https://docs.dapr.io/developing-applications/building-blocks/bindings/) in the Dapr documentation.

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The TrafficControlService uses the Dapr MQTT input binding to receive entry- and exit-cam messages over the MQTT protocol.
- The MQTT binding uses the lightweight MQTT message-broker Mosquitto that runs as part of the solution in a Docker container.
- The Camera Simulation publishes entry- and exit-cam messages to the MQTT broker.

This assignment targets number **5** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

First open the `src` folder in this repo in VS Code. Then open the [Bindings documentation](https://docs.dapr.io/developing-applications/building-blocks/bindings/) and start hacking away. As SMTP server, you can use the development SMTP server [MailDev](https://github.com/maildev/maildev).

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the [step-by-step instructions](step-by-step.md).

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 7](../Assignment07/README.md).
