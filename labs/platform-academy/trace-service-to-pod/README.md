# Full Lab: Trace Service Traffic to Ready Pods

## Goal

Debug a Kubernetes Service that exists and looks plausible but does not route to the running Pods. The failure is intentionally small: the Service selector does not match the labels on the Pod template.

## Time

30 to 45 minutes.

## Safety

Use a disposable local cluster such as kind, minikube, Docker Desktop Kubernetes, or a sandbox namespace. The lab creates the `payments` namespace and can be cleaned up with `./cleanup.sh`.

## Starting State

Check cluster readiness before mutating anything:

```bash
bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --preflight
```

Apply the broken manifest:

```bash
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster
```

Equivalent manual setup:

```bash
kubectl config current-context
kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml
kubectl wait --for=condition=available deploy/checkout -n payments --timeout=90s
```

The Deployment becomes available, but the Service selector points at labels the Pods do not have.
The preflight/setup path creates or recreates the `payments` namespace; the learner does not need an app namespace or Pods running ahead of time.

No-cluster path:

```bash
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
sed -n '1,220p' labs/platform-academy/trace-service-to-pod/triage-notes.md
sed -n '1,220p' labs/platform-academy/trace-service-to-pod/broken-evidence.txt
```

Setup creates the broken cluster state or stages the transcript, but it does not run the analyzer by default. Run the local analyzer after you inspect the Service, Pod labels, and EndpointSlice evidence, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py \
  --start labs/platform-academy/trace-service-to-pod/start.yaml \
  --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml \
  --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt
```

## Investigation

Run these commands before opening the solution:

```bash
kubectl describe svc checkout -n payments
kubectl get pods -n payments --show-labels
kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
```

Capture the triage false leads, the selector, the Pod labels, and the EndpointSlice result in your worksheet.
If you are using the no-cluster transcript, capture the same fields from `broken-evidence.txt`.
Use the analyzer output to prove the selector mismatch and source-manifest fix before applying anything.

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
bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --cluster
bash labs/platform-academy/trace-service-to-pod/validate.sh --cluster
```

## Success Criteria

- You can name the exact selector mismatch.
- You captured evidence before changing the manifest.
- You captured the local Service routing analyzer result.
- Your evidence note names the triage notes, false leads, Service selector, Pod label, EndpointSlice state, fix, validation, and cleanup.
- The fixed manifest changes source control intent, not just the live Service.
- Cleanup removes the disposable namespace.
