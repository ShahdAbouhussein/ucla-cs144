#### Part 1: Anything important about how your initWasm()/render() implementation works or any deviations from the skeleton?

I encountered an issue where the fractals were not loading even though the WASM module was initializing correctly, and after comparing my setup with a similar issue discussed on Piazza, I found that HEAPU8 was not being exported by Emscripten. 
Because render() accesses the pixel buffer through wasmModule.HEAPU8.buffer, JavaScript could not correctly read the image data from WASM memory, and so the fix was to add HEAPU8 to EXPORTED_RUNTIME_METHODS in the Makefile

#### Part 2: Confirm the image builds and /health returns JSON; note any base-image or build choices

I used the node:22-alpine base image because its small and provides reproducible builds, and to be able to take advantage of Docker layer caching, I copied package.json and package-lock.json first and ran npm ci --omit=dev before copying the rest of the source code, which allows Docker to reuse the dependency-installation layer when only application source files change

Health endpoint response:
{"status":"ok","hostname":"152cffbc6fcd"}

#### Part 3: Your Artifact Registry image URL, and confirmation that you observed the hostname changing across /health requests (load balancing working)

Artifact Registry image URL:
us-west1-docker.pkg.dev/stately-command-461906-h7/mandelbrot-repo/mandelbrot:v1

Load balancing verification:
I verified that requests were distributed across all three replicas by repeatedly sending requests to the /health endpoint and observing different hostnames in the responses:

{"status":"ok","hostname":"mandelbrot-deployment-56b7d4f468-rzdjc"}
{"status":"ok","hostname":"mandelbrot-deployment-56b7d4f468-cm2vf"}
{"status":"ok","hostname":"mandelbrot-deployment-56b7d4f468-zzdxj"}

This confirmed that the Kubernetes Service was load-balancing traffic across all three pods

#### Part 3F: A one-line summary of your k6 results (total requests, average response time, error rate)

The k6 load test completed 40,680 requests across 20 virtual users over 30 seconds (~1,356 requests/second), with an average response time of 14.59 ms, p95 latency of 26.17 ms, and a 0% error rate

#### Anything important we need to know about how to grade your project

While deploying to GKE, I initially had an architecture mismatch because the Docker image was built on an Apple Silicon machine and GKE nodes use linux/amd64. Rebuilding and pushing the image with docker buildx --platform linux/amd64 resolved the issue