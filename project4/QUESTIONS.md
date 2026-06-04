# Project 4 Questions

Answer each question in the space provided.

---

### Question 1: WebAssembly vs. JavaScript

Write a JavaScript function called `mandelbrotJS(cx, cy, maxIter)` that performs the same computation as your C `mandelbrot_iterate` function. Then write a short script (or add a button to your app) that times how long it takes to compute the full fractal using your JS function vs. the WASM module at the default zoom level.

Report both times below and explain why one is faster than the other. What does the browser do differently when executing WebAssembly compared to JavaScript?

**Your JS function:**

```js
function mandelbrotJS(cx, cy, maxIter) {
    let x = 0;
    let y = 0;
    let iter = 0;

    while (x * x + y * y <= 4 && iter < maxIter) {
        const computedX = x * x - y * y + cx;
        y = 2 * x * y + cy;
        x = computedX;
        iter++;
    }

    return iter;
```

**JS render time:**
31.6 ms

**WASM render time:**
20.8 ms

**Explanation:**
WASM was faster than JS because WASM is compiled ahead of time into a low-level binary format that the browser can execute knowing information like types and memory accesses. However, JS is interpreted at runtime (more overhead) and has to support dynamic features, which makes it slower for programs like mandelbrot thats more intensive in compute

---

### Question 2: WebAssembly Memory

When you call `wasmModule._create_buffer(width, height)`, it returns a number (e.g. `5243024`). What does this number represent? Why can't you use it directly as a JavaScript array — what additional step do you need to take to read the pixel data, and why?

**Answer:**
The value returned is a pointer to the pixel buffer in wasm memory and represents the offset within the wasm module's linear memory, not a JS array, so JS cannot directly dereference or access a wasm pointer because wasm pointer is different from js runtime

For js to be able to read the pixel data, you can create a typed-array view into the wasm module memory using HEAPU8, which tells JS where in the shared buffer to look


---

### Question 3: Docker Layer Caching

In your Dockerfile, you copied `package.json` and ran `npm install` before copying the rest of your source code. Suppose you reversed this and copied all files first, then ran `npm install`. What would happen to your build times as you iterate on your code? Why?

**Answer:**

If i copied all the files first and THEN ran npm install, docker would re-run npm install every time i change any source file, which would make builds so much slower while iterating because the cache layer would be invalidating by any edits

When we copy package.json/package-lock.json first, the dependency install layer is reused unless the dependencies themselves change

---

### Question 4: Kubernetes Pods and Scheduling

Run `kubectl get pods -o wide` and paste the output below. Which nodes are your pods running on? Why might Kubernetes schedule pods across different nodes rather than placing them all on the same node?

**Output:**

```
NAME                                     READY   STATUS    RESTARTS   AGE    IP            NODE                                                NOMINATED NODE   READINESS GATES
mandelbrot-deployment-66db4d8654-9h2cr   1/1     Running   0          111m   10.120.0.10   gke-mandelbrot-cluster-default-pool-773c8696-gmk2   <none>           <none>
mandelbrot-deployment-66db4d8654-jsg7f   1/1     Running   0          111m   10.120.1.14   gke-mandelbrot-cluster-default-pool-773c8696-t9vf   <none>           <none>
mandelbrot-deployment-66db4d8654-rjgt8   1/1     Running   0          110m   10.120.0.11   gke-mandelbrot-cluster-default-pool-773c8696-gmk2   <none>           <none>
```

**Answer:**

The three pods were distributed across two nodes. Pods 9h2cr and rjgt8 were running on node gke-mandelbrot-cluster-default-pool-773c8696-gmk2, while pod jsg7f was running on node gke-mandelbrot-cluster-default-pool-773c8696-t9vf

Kubernetes can schedule pods across seperate nodes to improve availability and fault tolerance because if all replicas were placed on the same node and that becomes unavailable for whatever reason, the entire application would go down. However, distributing replicas across two nodes guarantees that if one one node goes down, the application can still be available
---

### Question 5: Load Balancing

Run `curl http://<YOUR-EXTERNAL-IP>/health` at least five times and paste the responses below. What do you notice about the `hostname` field? What do these hostnames correspond to, and what does this tell you about how the LoadBalancer distributes traffic?

**Responses:**

```
{"status":"ok","hostname":"mandelbrot-deployment-66db4d8654-rjgt8"}
{"status":"ok","hostname":"mandelbrot-deployment-66db4d8654-rjgt8"}
{"status":"ok","hostname":"mandelbrot-deployment-66db4d8654-rjgt8"}
{"status":"ok","hostname":"mandelbrot-deployment-66db4d8654-rjgt8"}
{"status":"ok","hostname":"mandelbrot-deployment-66db4d8654-9h2cr"}
```

**Answer:**
The hostname field changed between requests and they correspond to the individual Kubernetes pods running the application, with most of the requests routed to pod rjgt8, while some were routed to pod 9h2cr. This shows that the LoadBalancer distributes traffic across multiple replicas rather than sending all requests to a single pod
---

### Question 6: Self-Healing

While your application is running, delete one of your pods:

```
kubectl delete pod <pod-name>
```

Immediately run `kubectl get pods` and paste the output. Then wait 30 seconds and run it again. What happened? Explain the role of the Deployment controller in what you observed.

**Output (immediately after delete):**

```
NAME                                     READY   STATUS        RESTARTS   AGE
mandelbrot-deployment-66db4d8654-9h2cr   1/1     Terminating   0          121m
mandelbrot-deployment-66db4d8654-fzxjk   1/1     Running       0          4s
mandelbrot-deployment-66db4d8654-jsg7f   1/1     Running       0          121m
mandelbrot-deployment-66db4d8654-w8dbv   1/1     Running       0          76s
```

**Output (30 seconds later):**

```
NAME                                     READY   STATUS    RESTARTS   AGE
mandelbrot-deployment-66db4d8654-fzxjk   1/1     Running   0          70s
mandelbrot-deployment-66db4d8654-jsg7f   1/1     Running   0          122m
mandelbrot-deployment-66db4d8654-w8dbv   1/1     Running   0          2m22s
```

**Answer:**
After I deleted pod mandelbrot-deployment-66db4d8654-9h2cr, Kubernetes immediately created a replacement pod named mandelbrot-deployment-66db4d8654-fzxjk while the old pod was terminating. When I ran it again 30 seconds later, the old pod had been completely removed and the deployment was back to three healthy running pods

This happens because the Deployment controller continuously monitors the desired state of the application and since the deployment was configured to maintain three replicas, deleting one pod caused Kubernetes to detect that only two replicas remained and automatically create a replacement 

---

### Question 7: Load Testing

Run your k6 load test (`k6 run k8s/loadtest.js`) and paste the summary output below. Then answer: what is the average response time and total number of requests completed? If you increased the number of replicas from 3 to 6 (using `kubectl scale deployment mandelbrot-deployment --replicas=6`), would you expect the average response time to decrease? Why or why not?

**k6 output:**

```
Total requests: 41,258
Average response time: 14.38 ms
Error rate: 0.00%
```

**Answer:**
The k6 load test completed 41,258 total requests with an average response time of 14.38 ms and a 0.00% error rate

I think if I increased the number of replicas from 3 to 6, the average response time would not decrease much because the /health endpoint is very lightweight, and the 3-replica deployment already handled the load with no failed requests and low latency, so more replicas would probably only help more if the pods were CPU-bound or handling heavier requests
