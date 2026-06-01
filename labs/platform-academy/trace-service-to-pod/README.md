# Full Lab: Trace Service Traffic to Ready Pods

## Goal

Debug a Kubernetes Service that exists and looks plausible but does not route to the running Pods. The failure is intentionally small: the Service selector does not match the labels on the Pod template.

## Time

30 to 45 minutes.

## Safety

Use a disposable local cluster such as kind, minikube, Docker Desktop Kubernetes, or a sandbox namespace. The lab creates the `payments` namespace and can be cleaned up with `./cleanup.sh`.

## Starting State

Apply the broken manifest:

```bash
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster
```

Equivalent manual setup:

```bash
kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml
kubectl wait --for=condition=available deploy/checkout -n payments --timeout=90s
```

The Deployment becomes available, but the Service selector points at labels the Pods do not have.

No-cluster path:

```bash
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
```

## Investigation

Run these commands before opening the solution:

```bash
kubectl describe svc checkout -n payments
kubectl get pods -n payments --show-labels
kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
```

Capture the selector, the Pod labels, and the EndpointSlice result in your worksheet.
If you are using the no-cluster transcript, capture the same fields from `broken-evidence.txt`.

## Fix

Apply the fixed source manifest only after you can explain the mismatch:

```bash
kubectl apply -f labs/platform-academy/trace-service-to-pod/fixed.yaml
kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
```

## Validation

File-only validation:

```bash
bash labs/platform-academy/trace-service-to-pod/validate.sh
```

Evidence-note validation:

```bash
bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence /tmp/trace-service-evidence.md
```

Cluster validation:

```bash
bash labs/platform-academy/trace-service-to-pod/validate.sh --cluster
```

## Success Criteria

- You can name the exact selector mismatch.
- You captured evidence before changing the manifest.
- Your evidence note names the Service selector, Pod label, EndpointSlice state, fix, validation, and cleanup.
- The fixed manifest changes source control intent, not just the live Service.
- Cleanup removes the disposable namespace.
