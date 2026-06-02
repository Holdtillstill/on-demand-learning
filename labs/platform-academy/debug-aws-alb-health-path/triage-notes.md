# Triage Notes: ALB Health Check Returns 404

## Evidence Source

These notes are a captured incident handoff for the ALB health path lab. Use them with `target-health.json`, `events.txt`, and the manifests when you do not have AWS or cluster access.

## Timeline

- 16:11 UTC: Checkout Ingress was promoted with a health check path annotation set to `/healthz`.
- 16:14 UTC: ALB target health began reporting `Target.ResponseCodeMismatch`.
- 16:16 UTC: The target group showed health checks failing with HTTP 404.
- 16:18 UTC: Controller events named a Service targetPort that did not match any selected Pod port name.
- 16:20 UTC: DNS, listener rule, and security group changes were checked and no change was found in the same window.

## False Leads Ruled Out

- DNS is not the first suspect because the ALB is receiving and evaluating target health checks.
- Security groups are not the first suspect because the symptom is HTTP 404, not timeout or connection refused.
- Recreating Pods is not supported by the evidence; the app is reachable but the health path and port contract are wrong.
- A console-only ALB health check edit would drift from the source manifest and miss the Service targetPort mismatch.

## Strongest Clues

- ALB reports `Target.ResponseCodeMismatch` with HTTP 404.
- The Ingress asks for `/healthz`, but the sample app only serves `/`.
- The Service routes to `targetPort: web`, while the Pod exposes a port named `http`.
- The fix needs source-manifest ownership plus app-owner confirmation of the intended health endpoint.

## Evidence To Save

- Target health reason and HTTP status.
- Ingress health check path.
- Service targetPort and Pod port name.
- Controller event naming the targetPort mismatch.
- Source-manifest diff, app health contract owner, analyzer result, and rollout handoff.
