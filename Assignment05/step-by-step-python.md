# Assignment 5 - Add a Dapr output binding

## Assignment goals

To complete this assignment, you must reach the following goals:

- The FineCollectionService uses the Dapr SMTP output binding to send an email.
- The SMTP binding calls a development SMTP server that runs as part of the solution in a Docker container.

This assignment targets number **4** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Run the SMTP server

In this assignment, you will use [MailDev](https://github.com/maildev/maildev) as your SMTP server. This is a 
development SMTP server that doesn't actually send out emails (by default), but collects them and shows them in an
inbox type web application it has built-in. This is extremely handy in test or demo scenarios.

You will run this server as a Docker container:

1. Open the terminal window in VS Code.

1. Start a MailDev SMTP server by entering the following command:

   ```console
   docker run -d -p 4000:1080 -p 4025:1025 --name dtc-maildev maildev/maildev:2.0.5
   ```

This will pull the docker image `maildev/maildev:2.0.5` from Docker Hub and start it. The name of the container will
be `dtc-maildev`. The server will be listening for connections on port `4025` for SMTP traffic and port `4000` for HTTP
traffic. This last port is where the inbox web app will run for inspecting the emails.

If everything goes well, you should see some output like this:

```console
❯ docker run -d -p 4000:1080 -p 4025:1025 --name dtc-maildev maildev/maildev:2.0.5
Unable to find image 'maildev/maildev:2.0.5' locally
2.0.5: Pulling from maildev/maildev
df9b9388f04a: Already exists
70c90f7de7cb: Pull complete
f83937c3ce37: Pull complete
98b78bba1d70: Pull complete
ee0959d18bfc: Pull complete
42bcb104f1ff: Pull complete
Digest: sha256:082ec5ee92266c6e17493998ff1bf1c3eb70604b159fbeeaa435ee777f5cc953
Status: Downloaded newer image for maildev/maildev:2.0.5
15460526eeec36fb10de920a92086797b69dab7638c7a7a8254d237346fd82e2
```

> If you see any errors, make sure you have access to the Internet and are able to download images from Docker Hub.
See [Docker Hub](https://hub.docker.com/) for more info.

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

> For your convenience, the `Infrastructure` folder contains Powershell scripts for starting the infrastructural
> components you'll use throughout the workshop. You can use the `Infrastructure/maildev/start-maildev.sh` script to
> start the MailDev container.
>
> If you don't mind starting all the infrastructural containers at once (also for assignments to come), you can also
> use the `Infrastructure/start-all.sh` script.

## Step 2: Use the Dapr output binding in the FineCollectionService

You will add code to the FineCollectionService so it uses the Dapr SMTP output binding to send an email:

1. Open the file `FineCollectionService/fine_collection/services.py` in VS Code.

1. Inspect the code of the `process_speed_violation` method. There's a TODO comment at the end of the method. You'll
   add code to complete this TODO and actually send an email.

1. Add an import statement at the top of the file so you can invoke the binding using a REST request:

     ```python
     import requests
     ```

1. Add the following code toe the `process_speed_violation` method to replace the TODO comment:

   ```python
   message_data = {
      "data": message_body,
      "operation": "create",
      "metadata": {
            "subject": "Fine for exceeding the speed limit.",
            "emailTo": vehicle.ownerEmail,
            "emailFrom": "test@domain.org"
      }
   }
   
   response = requests.post("http://localhost:3601/v1.0/bindings/sendmail", json=message_data)
   ```

   First, we create the message data containing the subject, sender, body, and recipient of the message.
   The message data also contains information about the operation that we want to invoke on the binding.
   Finally, we invoke the sendemail binding to send the message to the vehicle owner.

That's it, that's all the code you need to write to send an email over SMTP.  

## Step 3: Configure the output binding

In this step you will add a Dapr binding component configuration file to the custom components folder you created in
Assignment 3.

1. Add a new file in the `dapr/components` folder named `email.yaml`.

1. Open this file in VS Code.

1. Paste this snippet into the file:

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
       value: "_username"
     - name: password
       value: "_password"
     - name: skipTLSVerify
       value: true
   scopes:
     - finecollectionservice
   ```

As you can see, you specify the binding type SMTP (`bindings.smtp`) and you specify in the `metadata` how to connect to
the SMTP server container you started in step 1 (running on localhost on port `4025`). The other metadata can be
ignored for now.

Important to notice with bindings is the `name` of the binding. This name must be the same as the name used in the call
to the bindings API as you did in the code in step 2:

```python
response = requests.post("http://localhost:3601/v1.0/bindings/sendmail", json=message_data)
```

## Step 4: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line
using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the terminal windows)

1. Make sure all the Docker containers introduced in the previous assignments are running (you can use the
   `Infrastructure/start-all.ps1` script to start them).

1. Open the terminal window in VS Code and make sure the current folder is `VehicleRegistrationService`.

1. Enter the following command to run the VehicleRegistrationService with a Dapr sidecar:

   ```console
   dapr run --app-id vehicleregistrationservice --app-port 6002 --dapr-http-port 3602 --dapr-grpc-port 60002 --components-path ../dapr/components -- uvicorn vehicle_registration:app --port 6002
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `FineCollectionService`.

1. Enter the following command to run the FineCollectionService with a Dapr sidecar:

   ```console
   dapr run --app-id finecollectionservice --app-port 6001 --dapr-http-port 3601 --dapr-grpc-port 60001 --components-path ../dapr/components -- uvicorn fine_collection:app --port 6001
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `TrafficControlService`.

1. Enter the following command to run the TrafficControlService with a Dapr sidecar:

   ```console
   dapr run --app-id trafficcontrolservice --app-port 6000 --dapr-http-port 3600 --dapr-grpc-port 60000 --components-path ../dapr/components -- uvicorn traffic_control:app --port 6000
   ```

1. Open a **new** terminal window in VS Code and change the current folder to `Simulation`.

1. Start the simulation:

   ```console
   python simulation
   ```

You should see the same logs as before. But now you should also be able to see the fine emails being sent by the
FineCollectionService:

1. Open a browser and browse to [http://localhost:4000](http://localhost:4000).
1. Wait for the first emails to come in.
1. Click on an email in the inbox to see its content:
   <img src="img/inbox.png" style="zoom:67%;" />

## Next assignment

Make sure you stop all running processes and close all the terminal windows in VS Code before proceeding to the next
assignment.

Go to [assignment 6](../Assignment06/README.md).
