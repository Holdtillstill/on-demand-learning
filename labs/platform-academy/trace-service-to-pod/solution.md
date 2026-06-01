# Solution: Trace Service Traffic to Ready Pods

## Diagnosis

The Service starts with this selector:

```yaml
selector:
  app: checkout
```

The Deployment creates Pods with this label:

```yaml
app: checkout-api
```

Because selectors are exact label matches, the Service has no ready checkout backends. The Deployment can be healthy while the Service still routes nowhere.

## Evidence

Expected evidence from the broken state:

- `kubectl describe svc checkout -n payments` shows `Selector: app=checkout`.
- `kubectl get pods -n payments --show-labels` shows `app=checkout-api`.
- `kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout` has no ready backend addresses for the checkout Pods.
- `broken-evidence.txt` contains the same signals for learners using the no-cluster path.

The local Service routing analyzer verifies the broken and fixed states without a cluster:

```bash
python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py \
  --start labs/platform-academy/trace-service-to-pod/start.yaml \
  --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml \
  --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt
```

Expected result: `Service routing analysis passed`, with selector-risk, Pod-label, EndpointSlice, fixed-target, and cleanup evidence.

## Fix

Change the Service selector to match the Pod template labels:

```yaml
selector:
  app: checkout-api
```

The fixed manifest keeps the Deployment labels unchanged and updates the Service to select `app=checkout-api`.

## Handoff Note

A good handoff says: Deployment is available, but the Service selector is `app=checkout` while Pods are labeled `app=checkout-api`, so EndpointSlices have no ready addresses. The source fix is to update the Service selector in `fixed.yaml`, apply it, verify ready EndpointSlice addresses, and clean up `payments`.

## Validation

After applying `fixed.yaml`, the Service should produce EndpointSlices with ready checkout Pod addresses. If the cluster supports EndpointSlices, verify with:

```bash
kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
```

## Cleanup

```bash
bash labs/platform-academy/trace-service-to-pod/cleanup.sh
```
