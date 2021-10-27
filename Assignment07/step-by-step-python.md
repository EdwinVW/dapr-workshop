# Assignment 7 - Add secrets management

## Assignment goals

To complete this assignment, you must reach the following goals:

- The credentials used by the SMTP output binding to connect to the SMTP server are retrieved using the Dapr secrets
  management building block.
- The FineCollectionService retrieves the license key for the `FineCalculator` component it uses from the Dapr secrets
  management building block.

This assignment targets number **6** in the end-state setup:

<img src="../img/dapr-setup.png" style="zoom: 67%;" />

## Step 1: Add a secret store component

First, you will add a secrets management component configuration to the project:

1. Add a new file in the `dapr/components` folder named `secrets.json`.

1. Open this file in VS Code. The file will hold the secrets used in the application.

1. Paste the following snippet into the file:

   ```json
   {
       "smtp":{
           "user": "_username",
           "password": "_password"
       },
       "finecalculator":{
           "licensekey": "HX783-K2L7V-CRJ4A-5PN1G"
       }
   }
   ```

1. Add a new file in the `dapr/components` folder named `secrets-file.yaml`.

1. Open this file in VS Code.

1. Paste the following snippet into the file:

   ```yaml
   apiVersion: dapr.io/v1alpha1
   kind: Component
   metadata:
     name: trafficcontrol-secrets
   spec:
     type: secretstores.local.file
     version: v1
     metadata:
     - name: secretsFile
       value: ../dapr/components/secrets.json
     - name: nestedSeparator
       value: "."
   scopes:
     - finecollectionservice   
   ```

As you can see, the `local.file` secret store is used. Important to note here, is that if you specify the path to the
`secretsFile` using a relative path (as is the case here), you need to specify this path relative to the folder where
you start your service from using the Dapr CLI. Because you start the services from their project folders, the relative
path to the components folder is always `../dapr/components`.

> As stated, the file-based local secret store component is only for development or testing purposes and is not suitable for production!

The `nestedSeparator` in the `metadata` section specifies the character that Dapr will use when it flattens the secret  
file's hierarchy. Eventually, each secret will be uniquely identifiable by one key. In this case, you're using the
period (`.`) as character. That means that the secrets from the `secrets.json` file will be identified by the following
keys:

- `smtp.user`
- `smtp.password`
- `finecalculator.licensekey`

Now you've configured the secrets management building block. Time to use the secrets.

## Step 2: Get the credentials for connecting to the SMTP server

As stated, you can reference secrets from other Dapr component configuration files.

1. Open the file `dapr/components/email.yaml` in VS Code.

1. Inspect the contents of the file. As you can see, it contains clear-text credentials (username and password).
   Replace the `user` and `password` fields of the `metadata` with secret references and add a reference to the secrets
   management building block named `trafficcontrol-secrets` you configured in step 1. The resulting file should look
   like this:

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
     secretStore: trafficcontrol-secrets
   scopes:
     - finecollectionservice  
   ```

Now, the output binding will use the `smtp.username` and `smtp.password` secrets from the secrets file at runtime.

## Step 3: Get the license key for the FineCalculator component

The `ViolationProcessor` of the FineCollectionService uses a `FineCalculator` implementation to calculate the fine for
a certain speeding violation (check out the code). The calculator used is implemented in the
`FineCollectionService/fine_collection/services.py` file. It checks a license key (because we can). This license
key has to be loaded from a secret since we don't want anyone stealing the key.

Currently we load the license key from `FineCollectionService/.env` which isn't secure. We're going to change
the application so it loads the license key as a secret.

1. Open the file `FineCollectionService/fine_collection/__init__.py` in VS Code.

2. Add the following import to the top of the file:

   ```python
   from dapr.clients import DaprClient
   ```

3. Replace the assignment of the `license_key` variable with the following code:

```python
with DaprClient() as client:
    license_key = client.get_secret("trafficcontrol-secrets", "finecalculator.licensekey").secret["finecalculator.licensekey"]
```

Now you're ready to test the application.

## Step 4: Test the application

You're going to start all the services now. You specify the custom components folder you've created on the command-line using the `--components-path` flag so Dapr will use these config files:

1. Make sure no services from previous tests are running (close the terminal windows).

1. Make sure all the Docker containers introduced in the previous assignments are running (you can use the `Infrastructure/start-all.sh` script to start them).

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
   python3 simulation
   ```

You should see the same logs as before.

If you examine the Dapr logging, you should see a line in there similar to this:

```console
INFO[0000] component loaded. name: trafficcontrol-secrets, type: secretstores.local.file/v1  app_id=finecollectionservice instance=edsger scope=dapr.runtime type=log ver=1.2.2
```

## Step 5: Validate secret store operation

To validate that the secrets management building block is actually used:

1. Stop the Camera Simulation and the FineCollectionService.
1. Change the `finecalculator.licensekey` secret in the file `dapr/components/secrets.json` to something different.
1. Start the Camera Simulation and the FineCollectionService again as described in step 4.

Now you should see some errors in the logging because the FineCollectionService service is no longer passing the correct license key in the call to the `FineCalculator` component:

   ```console
   == APP ==     raise ValueError("Invalid license key")
   == APP == ValueError: Invalid license key
   ```

Don't forget to change the license key in the secrets file back to the correct one!

## Final solution

You have reached the end of the hands-on assignments. If you haven't been able to do all the assignments, go to this [this repository](https://github.com/wmeints/dapr-traffic-control) for the end result.

Thanks for participating in these hands-on assignments! Hopefully you've learned about Dapr and how to use it. Obviously, these assignment barely scratch te surface of what is possible with Dapr. We have not touched upon subjects like: hardening production environments, actors, integration with cloud-specific services, just to name a few. So if you're interested in learning more, I suggest you read the [Dapr documentation](https://docs.dapr.io).
