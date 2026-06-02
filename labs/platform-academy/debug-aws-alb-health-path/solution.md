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

The local ALB health analyzer verifies the evidence without AWS credentials:

```bash
python3 labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py \
  --target-health labs/platform-academy/debug-aws-alb-health-path/target-health.json \
  --events labs/platform-academy/debug-aws-alb-health-path/events.txt \
  --broken labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml \
  --fixed labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml
```

Expected result: `ALB health path analysis passed`, with ALB, health-path, Service/Pod, controller-event, fixed-target, and owner-decision evidence.

The triage notes rule out DNS, security groups, Pod recreation, and console-only ALB edits as first fixes before changing source manifests.

## Fix

`fixed-ingress-service.yaml` changes:

- ALB health check path from `/healthz` to `/`.
- Service target port from `web` to `http`.

In a real service, the better fix might be to implement `/healthz` in the app and keep the path. The important move is to make the health check path and Service target port match the application contract.

## Handoff Note

A good handoff says: `triage-notes.md` rules out DNS, security groups, Pod recreation, and console-only false leads. ALB reports `Target.ResponseCodeMismatch` with 404, the Ingress health check path is `/healthz`, the Service sends traffic to `targetPort: web`, and the Pod only exposes port name `http`. The source fix in this lab changes the health path to `/` and targetPort to `http`; in production, the app owner must confirm whether `/healthz` should exist instead.

## Cleanup

No cleanup is required for the default captured-evidence path. If you used the optional disposable-cluster path, run:

```bash
bash labs/platform-academy/debug-aws-alb-health-path/cleanup.sh
```
