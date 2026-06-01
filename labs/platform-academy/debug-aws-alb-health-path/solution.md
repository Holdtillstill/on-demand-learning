# Solution: Debug an AWS ALB Health Path

## Diagnosis

The evidence shows two related health-check problems:

- ALB target health reports `Target.ResponseCodeMismatch` and `Health checks failed with code 404`.
- The Kubernetes Service uses `targetPort: web`, but the Pod exposes a named port `http`.

The controller event directly calls out the Service-to-Pod port mismatch:

```text
service checkout targetPort web has no matching Pod port name on checkout-example
```

The Ingress also configures `/healthz` as the ALB health check path. The sample Pod is nginx, which returns 200 on `/` by default, not `/healthz`.

## Fix

`fixed-ingress-service.yaml` changes:

- ALB health check path from `/healthz` to `/`.
- Service target port from `web` to `http`.

In a real service, the better fix might be to implement `/healthz` in the app and keep the path. The important move is to make the health check path and Service target port match the application contract.

## Handoff Note

A good handoff says: ALB reports `Target.ResponseCodeMismatch` with 404, the Ingress health check path is `/healthz`, the Service sends traffic to `targetPort: web`, and the Pod only exposes port name `http`. The source fix in this lab changes the health path to `/` and targetPort to `http`; in production, the app owner must confirm whether `/healthz` should exist instead.

## Cleanup

No cleanup is required for the default captured-evidence path.
