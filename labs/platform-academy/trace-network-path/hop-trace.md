# Hop Trace: Checkout Health Path 503

## Evidence Source

This hop trace is a captured incident worksheet for the network path lab. Use it with `incident-handoff.md`, `network-evidence.md`, and the manifests when you do not have AWS or cluster access.

## Hop-By-Hop Evidence

| Hop | Evidence | Status | Owner note |
| --- | --- | --- | --- |
| Client | `curl -I https://checkout.example.com/healthz` returns `HTTP/2 503` | Failing | Save exact status and server header |
| DNS | Host resolves to `k8s-payments-checkout-123456.us-west-2.elb.amazonaws.com` | Expected | DNS owner is ruled out for this packet |
| ALB | Target health reports `Target.ResponseCodeMismatch` | Symptom | Do not make console-only changes yet |
| Ingress | Host `checkout.example.com` path `/healthz` routes to Service `checkout` port `http` | Expected | Ingress owner is not primary unless backend changes |
| Service | Port `http: 80` routes to `targetPort web` | Failing clue | Source manifest owner must fix this |
| Pod | Selected Pod exposes named port `http:8080` | Expected | Pod port name does not match Service targetPort |

## False Leads Ruled Out

- DNS is not the first fix because the host resolves to the expected ALB.
- ALB listener rules are not the first fix because the Ingress still points at the expected Service.
- Recreating Pods is not the first fix because the Pod exposes a valid `http` port.
- A console-only target group edit would not correct the source manifest.

## Strongest Clue

Traffic reaches the Kubernetes backend path, but Service `targetPort web` does not match the selected Pod port name `http`. Preserve the Ingress host/path and change the Service source manifest to `targetPort: http`.

## Evidence To Save

- Client status and `awselb/2.0` header.
- DNS target.
- ALB `Target.ResponseCodeMismatch`.
- Ingress backend Service and port.
- Service targetPort and Pod port name.
- Fixed manifest diff, validation output, and cleanup or no-cluster handoff.
