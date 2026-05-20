# Deploying Chat App to Google Kubernetes Engine with HTTPS

## Installing Docker

If you do not have Docker installed (e.g. on a fresh GCP VM), run the following commands:

```
sudo apt install docker.io
mkdir -p ~/.docker/cli-plugins
```

Install the `buildx` plugin (replace the URL with your CPU architecture and desired version if needed):

```
curl -L "https://github.com/docker/buildx/releases/download/v0.12.1/buildx-v0.12.1.linux-amd64" -o ~/.docker/cli-plugins/docker-buildx
chmod +x ~/.docker/cli-plugins/docker-buildx
```

Add your user to the `docker` group so you can run Docker without `sudo`:

```
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

You may also need to change the group ownership of the Docker socket:

```
sudo chgrp docker /var/run/docker.sock
```

Then restart your shell (log out and log back in) for the group change to take effect.

Alternatively, you can run the provided `install-docker.sh` script which performs all of the above steps:

```
chmod +x install-docker.sh
./install-docker.sh
```

## Building the Docker Image

To build the Docker image using the standard `docker build` command:

```
docker build -t REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG .
```

For example:

```
docker build -t us-west1-docker.pkg.dev/my-project/my-repo/chat-app:latest .
```

### Building with `buildx`

`buildx` allows you to build multi-platform images (e.g. for both `amd64` and `arm64`). To build and push in one step:

```
docker buildx build --platform linux/amd64,linux/arm64 \
    -t REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG \
    --push .
```

If you only need a single platform (e.g. `amd64` for GKE), you can simplify:

```
docker buildx build --platform linux/amd64 \
    -t REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG \
    --push .
```

Note that `--push` requires you to be authenticated with your artifact registry first:

```
gcloud auth configure-docker REGION-docker.pkg.dev
```

### Pushing the Image (without `buildx`)

If you used `docker build` (without `--push`), push the image separately:

```
docker push REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG
```

## Deploying to Google Kubernetes Engine

1. Follow the directions from Lecture 15 README.

2. Create a GKE cluster. You only need to do this once. This can take quite a while.

```
gcloud container clusters create YOUR_CLUSTER_NAME \
    --zone YOUR_CLUSTER_ZONE \
    --machine-type e2-small \
    --num-nodes 1
```

In my case, I am going to name the cluster `cs144` and use `us-west1-a` as that is where my artifact
registry is. We will use an `e2-small` since this app does not require many resources. We will also
start with 1 node (not that this 1 node, not 1 pod).

`us-west1` is heavily constrained. You can also use `us-central1` or `us-east1`. If you do this, you
should create your artifact registry in that same region. If you do not, you will be charged for egress
when pulling the Docker image, but this is a very minimal charge (1 cent per GB).

3. Create and apply both the `deployment.yaml` and `service.yaml` files, similar to Lecture 15.

```
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

If either of these commands fail with a network communication error, you may need to reauthenticate:

`gcloud container clusters get-credentials <CLUSTER_NAME> --zone <ZONE> --project <PROJECT_ID>`

4. Create the managed certificate by creating `certificate.yaml` and then apply:

`kubectl apply -f certificate.yaml`

You **will need** a domain name for this.

This can take quite a while (15 minutes to 2 hours). Execute the following command to see progress:

`kubectl describe managedcertificate your-appname-certificate`

You want to see something like the following:

```
Name:         chat-app-certificate
Namespace:    default
Labels:       <none>
Annotations:  <none>
API Version:  networking.gke.io/v1
Kind:         ManagedCertificate
Metadata:
  Creation Timestamp:  2025-05-28T19:05:49Z
  Generation:          5
  Resource Version:    1748462410937231006
  UID:                 ...
Spec:
  Domains:
    gke-demo.cs144.org
Status:
  Certificate Name:    mcrt-...
  Certificate Status:  Active
  Domain Status:
    Domain:     gke-demo.cs144.org
    Status:     Active
  Expire Time:  2025-08-26T12:44:36.000-07:00
Events:
  Type    Reason  Age   From                            Message
  ----    ------  ----  ----                            -------
  Normal  Create  55m   managed-certificate-controller  Create SslCertificate mcrt-,,,
```

5. Once the certificate is active, create the ingress, which is the gateway into the GKE cluster in `ingress.yaml` and configure with

`kubectl apply -f ingress.yaml`

Note that in the template I provide, one line is commented out. You must uncomment this line.

6. Create the front end configuration which forces an upgrade from HTTP to HTTPS. Note that the path section
looks similar to a route. That is not a coincidence.

`kubectl apply -f frontendconfig.yaml`

7. Go to your domain. You should see your site without any security warnings.

Note that you may need to change your ingress or frontend configuration if your app breaks. This is usually due to incompatibilities
between Google Cloud's load balancer and your app's implementation.

## Start with a Clean Environment

If you need to start fresh, you can stop and remove a running container, then delete the image.

1. Stop the running container:

```
docker stop CONTAINER_ID
```

2. Remove the container:

```
docker rm CONTAINER_ID
```

3. Delete the image:

```
docker rmi REGION-docker.pkg.dev/PROJECT_ID/REPO_NAME/IMAGE_NAME:TAG
```

You can find the container ID with `docker ps -a` and the image ID with `docker images`.
