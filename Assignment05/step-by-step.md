# Assignment 5 - Add a Dapr output binding

## Assignment goals

In order to complete this assignment, the following goals must be met:

- The FineCollectionService uses the Dapr SMTP output binding to send an email.
- The SMTP binding calls a development SMTP server that runs as part of the solution in a Docker container.

This assignment targets number **4** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Use the Dapr output binding in the FineCollectionService

You will add code to the FineCollectionService so it uses the Dapr SMTP output binding to send an email:

1. Open the `src` folder in this repo in VS Code.

1. Open the file `src/FineCollectionService/Controllers/CollectionController.cs` in VS Code.

1. Inspect the code of the `CollectFine` method. You see a TODO at the end of the class. You will solve this TODO.

1. If you have already executed Assignment 3, you have already added a reference to the `Dapr.AspNetCore` package and you can skip the next 3 tasks.

1. Open the terminal window in VS Code and make sure the current folder is `src/TrafficControlService`.

1. Add a reference to the Dapr ASP.NET Core integration library:

    ```console
    dotnet add package Dapr.AspNetCore
    ```

1. Restore all references:

    ```console
    dotnet restore
    ```

1. Add a using statement in the `CollectionController` file so you can use the Dapr client:

    ```csharp
    using Dapr.Client;
    ```

1. Add an argument named `daprClient` of type `DaprClient` to the `CollectFine` method that is decorated with the `[FromServices]` attribute:

    ```csharp
    public Task<ActionResult> CollectFine(SpeedingViolation speedingViolation, [FromServices] DaprClient daprClient)
    ```

1. In order to send an email, you first need to create some body to send as email. This email must contain the details of the speeding violation and the fine. The service already has a helper method to create a body. Replace the `// TODO` in the `CollectFine` method with this code:

    ```csharp
    var body = EmailUtils.CreateEmailBody(speedingViolation, vehicleInfo, fineString);
    ```

1. Next to the body, you need to specify the sender, recipient and subject of the email. With bindings, you specify this using a dictionary containing `metadata`. Add the following code right after the creation of the body:

     ```csharp
     var metadata = new Dictionary<string, string>
     {
       ["emailFrom"] = "noreply@cfca.gov",
       ["emailTo"] = vehicleInfo.OwnerEmail,
       ["subject"] = $"Speeding violation on the {speedingViolation.RoadId}"
     };
     ```

1. Now you have everything you need to call the SMTP server using the Dapr output binding. Add the following code right after the creation of the metadata:

     ```csharp
     await daprClient.InvokeBindingAsync("sendmail", "create", body, metadata).Wait();
     ```

     > The first two parameters passed into `InvokeBindingAsync` are the name of the binding to use and the operation (in this case 'create' the email).

1. Open the file `src/FineCollectionService/Startup.cs`.

1. The service uses the `DaprClient`. Therefore, it needs to be registered with dependency injection. The `Dapr.AspNetCore` has all kinds of convenience methods for these kinds of things. If you haven't executed Assignment 3 yet, add the following line to the `ConfigureServices` method to register the `DaprClient` with dependency injection:

     ```csharp
     services.AddDaprClient();
     ```

That's it, that's all the code you need to ask to send an email over SMTP.  

## Step 2: Run the SMTP server

As SMTP server you will use [MailDev](https://github.com/maildev/maildev). This is a development SMTP server that doesn't actually send out emails (by default), but collects them and shows them in an inbox type web application it has built-in. This is extremely handy in test or demo scenarios.

You will run this server as a Docker container:

1. Open the terminal window in VS Code.

1. Start a MailDev SMTP server by entering the following command:

   ```console
   docker run -d -p 4000:80 -p 4025:25 --name dtc-maildev maildev/maildev:latest
   ```

This will pull the docker image `maildev/maildev:latest` from Docker Hub and start it. The name of the container will be `dtc-maildev`. The server will be listening for connections on port `4025` for SMTP traffic and port `4000` for HTTP traffic. This last port is where the inbox web app will run for inspecting the emails.

If everything goes well, you should see some output like this:

![](img/docker-maildev-output.png)

> If you see any errors, make sure you have access to the Internet and are able to download images from Docker Hub. See [Docker Hub](https://hub.docker.com/) for more info.

The container will keep running in the background. If you want to stop it, enter the following command:

```console
docker stop dtc-maildev
```

You can then start the container later by entering the following command:

```console
docker start dtc-maildev
```

If you are done using the container, you can also remove it by entering the following command:

```console
docker rm dtc-maildev -f
```

Once you have removed it, you need to start it again with the `docker run` command shown at the beginning of this step.

## Step 3: Configure the output binding

If you haven't executed assignment 3 yet, you have been using the Dapr components that are installed by default when you install Dapr on a machine. These are a state management component and a pub/sub component. They both use the Redis server that is also installed by default. These components are installed in the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on Linux or Mac.

Because you need to add configuration for an output binding, you will use a separate folder with the component configuration files and use this folder when starting the services using the Dapr CLI. You can specify which folder to use on the command-line with the `--components-path` flag.

If you have already executed assignment 3, you can skip the first 2 tasks:

1. Create a new folder `src/dapr/components`.

1. Copy all files from the folder `%USERPROFILE%\.dapr\components\` on Windows and `$HOME/.dapr/components` on Linux or Mac to the `src/dapr/components` folder.

1. Add a new file in the `src/dapr/components` folder named `email.yaml`.

1. Open the file `src/dapr/components/email.yaml` in VS Code.

1. Change the content of this file to:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: sendmail
   spec:
     type: bindings.smtp
     version: v1
     metadata:
     - name: host
       value: localhost
     - name: port
       value: 4025
     - name: user
       secretKeyRef:
         name: smtp.user
         key: smtp.user
     - name: password
       secretKeyRef:
         name: smtp.password
         key: smtp.password
     - name: skipTLSVerify
       value: true
   auth:
     secretStore: secret-store-file
   ```

As you can see, you specify the binding type SMTP (`bindings.smtp`) and you specify in the `metadata` how to connect to the SMTP server container you started in step 2 (running on localhost on port `4025`). The other metadata can be ignored for now.

Important to notice with bindings is the `name` of the binding. This name must be the same as the name used in the call to the bindings API as you did in step 1:

```csharp
daprClient.InvokeBindingAsync("sendmail", "create", body, metadata).Wait();
```

## Step 4: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the command-shell windows).

1. If you have executed assignment 3 and the RabbitMQ container is not yet running, start it by entering the following command:

   ```console
   docker run -d -p 5672:5672 --name dtc-rabbitmq rabbitmq:3-alpine
   ```

1. Open the terminal window in VS Code and make sure the current folder is `src/VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 5002 --dapr-http-port 3502 --dapr-grpc-port 50002 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 5001 --dapr-http-port 3501 --dapr-grpc-port 50001 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 5000 --dapr-http-port 3500 --dapr-grpc-port 50000 --components-path ../dapr/components dotnet run
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `src/Simulation`.

1. Start the simulation:

   ```console
   dotnet run
   ```

You should see the same logs as before. But now you should also be able to see the fine emails being sent by the FineCollectionService:

1. Open a browser and browse to [http://localhost:4000](http://localhost:4000). 
1. Wait for the first emails to come in. 
1. Click on an email in the inbox to see its content:
   <img src="img/inbox.png" style="zoom:67%;" />

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next assignment.

Go to [assignment 6](../Assignment06/README.md).
