# Assignment 5 - Add secrets management

In this assignment, you're going to add Dapr **secrets management** to retrieve an API key for calling the RDW Government service.

## Dapr secrets management building block

Almost all non-trivial applications need to _securely_ store secret data like API keys, database passwords, and more. By nature, these secrets should not be checked into the version control system, but they also need to be accessible to code running in production. This is generally a hard problem, but it's critical to get it right. Otherwise, critical production systems can be compromised.

Dapr's solution to this problem is the secrets API and secrets stores.

Here's how it works:

- Dapr is set up to use a **secret store** - a place to securely store secret data
- Application code uses the standard Dapr secrets API to retrieve secrets.

Some examples for secret stores include `Kubernetes`, `Hashicorp Vault`, `Azure KeyVault`.

Application code can call the secrets building block API to retrieve secrets from Dapr supported secret stores that can be used in your code. For example, the diagram below shows an application requesting the secret called "mysecret" from a secret store called "vault" from a configured cloud secret store:

<img src="img/secrets_cloud_stores.png" style="zoom:67%;" />

> For this assignment you are supposed to use the file-based local secret-store component. This is only for development or testing purposes. Never use this component in production!

Another way of using secrets, is to reference them from Dapr configuration files. You will use both ways of working with secrets in this assignment.

For this hands-on assignment, this is all you need to know about this building-block. If you want to get more detailed information, read the [introduction to this building-block](https://docs.dapr.io/developing-applications/building-blocks/secrets/) in the Dapr documentation.

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The credentials used by the SMTP output binding to connect to the SMTP server are retrieved using the Dapr secrets management building block.
- The FineCollectionService retrieves the license-key for the `FineCalculator` component it uses from the Dapr secrets management building block.

**This assignment can only be executed if you have executed assignment 5!**

This assignment targets number **6** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## DIY instructions

First open the `src` folder in this repo in VS Code. Then open the [Secrets management documentation](https://docs.dapr.io/developing-applications/building-blocks/secrets/) and start hacking away.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the [step-by-step instructions](step-by-step.md).

## Final solution

You have reached the end of the hands-on assignments. If you haven't been able to do all the assignments, go this [this repository](https://github.com/edwinvw/dapr-traffic-control) for the end-result.

Thanks for participating in these hands-on assignments! Hopefully you've learned about Dapr and how to use it. Obviously, these assignment barely scratch te surface of what is possible with Dapr. We have not touched upon subjects like: security, actors, integration with Azure Functions, Azure API Management and Azure Logic Apps just to name a few. So if you're interested in learning more, I suggest you read the [Dapr documentation](https://docs.dapr.io).
