# Solution: Trace an HTTP Request Across the Network Path

## Diagnosis

The pager handoff in `incident-handoff.md` says the affected path is `checkout.example.com/healthz`, the customer-visible symptom is `HTTP/2 503`, and no live DNS, ALB, or Kubernetes change should be made from this lab.

The client reaches the ALB and the Ingress route points to the `checkout` Service, so DNS and host/path routing are not the primary failure.

The broken Service uses:

```yaml
targetPort: web
```

The Pod exposes:

```yaml
ports:
  - name: http
    containerPort: 8080
```

The Service references a named target port that does not exist on the Pod. The correct target port name is `http`.

## Evidence

Expected evidence:

- `incident-handoff.md` records the impact, safety boundary, and owner notes.
- Client receives `HTTP/2 503` from `awselb/2.0`.
- ALB target health includes `Target.ResponseCodeMismatch` and an unhealthy target.
- Ingress routes `checkout.example.com/healthz` to Service `checkout` port `http`.
- Service maps `port http: 80 -> targetPort web`.
- Pod exposes a named port `http:8080`.
- DNS owner is ruled out because the hostname still resolves to the expected ALB.
- ALB owner is ruled out for console-only action because target health points back to Kubernetes backend behavior.
- App/platform owner owns the source-manifest fix.

## Fix

Set the Service target port to the Pod's named port:

```yaml
targetPort: http
```

`fixed-ingress-service.yaml` applies that change and leaves the host/path route intact.

## Evidence to Save

Save the request status, DNS target, ALB reason, Ingress backend, Service targetPort, Pod port name, owners ruled out, source-manifest fix, validation output, and no-cluster note in `evidence-template.md`.

## Cleanup

No cleanup is needed for the default captured-evidence path.
