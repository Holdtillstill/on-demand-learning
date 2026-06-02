# Triage Notes: Checkout Service Has No Ready Backends

## Evidence Source

These notes are a captured on-call handoff for the Service routing lab. Use them with `broken-evidence.txt` when you do not have a disposable cluster.

## Timeline

- 14:02 UTC: `checkout` Deployment rollout completed after a manifest-only label cleanup.
- 14:04 UTC: Synthetic check through Service `checkout` began returning `503 no healthy upstream`.
- 14:06 UTC: `kubectl rollout status deploy/checkout -n payments` still reported success.
- 14:08 UTC: EndpointSlice for Service `checkout` showed `<none>` for ready backend addresses.
- 14:10 UTC: No NetworkPolicy, DNS, or node readiness change was found in the same window.

## False Leads Ruled Out

- Pod readiness is not the first suspect because both checkout Pods report `READY 1/1`.
- Service port wiring is not the first suspect because Service port `http` still targets Pod port name `http`.
- Node or CNI pressure is not supported by the transcript because the Deployment is available and Pods are running.
- A live Service patch would be temporary; the source manifest still needs the selector fix.

## Strongest Clue

The Service selector is still `app=checkout`, but the Pod template now labels Pods as `app=checkout-api`. The EndpointSlice has no ready addresses because no selected Pods match the Service selector.

## Evidence To Save

- Service selector before the fix.
- Pod labels before the fix.
- EndpointSlice `<none>` state before the fix.
- Source-manifest diff changing the Service selector to `app=checkout-api`.
- Post-fix EndpointSlice output and cleanup result.
