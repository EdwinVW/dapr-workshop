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

![](img/secrets_cloud_stores.png)

> For this assignment you are supposed to use the file-based local secret-store component. This is only for development or testing purposes. Never use this component in production!

For this hands-on assignment, this is all you need to know about this building-block. If you want to get more detailed information, read the [introduction to this building-block](https://github.com/dapr/docs/blob/master/concepts/secrets/README.md) in the Dapr documentation.

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The `GetVehicleDetails` method of the `RDWController` in the Government service requires an API key to be specified in the URL like this: `/rdw/{apiKey}/vehicle/{licenseNumber}`.
- The TrafficControl service reads this API key from a Dapr secret store and passes it in the call to the Government service.

## DIY instructions

First open the `Assignment 5` folder in this repo in VS Code. Then open the [Dapr documentation](https://github.com/dapr/docs) and start hacking away. Make sure you use the default Redis pub/sub component provided out of the box by dapr.

## Step by step instructions

To get step-by-step instructions to achieve the goals, open the [step-by-step instructions](step-by-step.md).

## Final solution

You have reached the end of the hands-on assignments. If you look at the solution in the `Final` folder in this repo, you can see the code as it should be after finishing assignment 5.

Thanks for participating in these hands-on assignments! Hopefully you've learned about Dapr and how to use it. Obviously, these assignment barely scratch te surface of what is possible with Dapr. We have not touched upon subjects like: *security*, *bindings*, integration with *Azure Functions* and *Azure Logic Apps* just to name a few. So if you're interested in learning more, I suggest you read the [Dapr documentation](https://github.com/dapr/docs).
