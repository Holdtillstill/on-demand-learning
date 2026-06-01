# Full Lab: Debug an AWS ALB Health Path

## Goal

Use captured ALB target health, Kubernetes Ingress/Service YAML, and controller events to identify why one target is unhealthy.

## Time

35 to 55 minutes.

## Safety

No AWS account is required. This lab uses local exported evidence and a client-side Kubernetes parse check.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/debug-aws-alb-health-path/target-health.json
sed -n '1,260p' labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
sed -n '1,160p' labs/platform-academy/debug-aws-alb-health-path/events.txt
cp labs/platform-academy/debug-aws-alb-health-path/evidence-template.md /tmp/alb-health-evidence.md
```

Optional parse check:

```bash
kubectl create --dry-run=client --validate=false -f labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
```

## Investigation

Find:

- The ALB target health reason.
- The configured ALB health check path.
- The Service target port.
- The Pod port name.
- Any controller event that names the mismatch.
- Whether the application path also returns a 404.

## Remediation Target

```bash
diff -u labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml || true
```

## Validation

```bash
bash labs/platform-academy/debug-aws-alb-health-path/validate.sh
bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence /tmp/alb-health-path-evidence.md
```

## Success Criteria

- You identify `Target.ResponseCodeMismatch`.
- You identify the `targetPort: web` mismatch.
- You explain why `/healthz` returning 404 also needs owner confirmation.
- You propose a source-manifest fix rather than a console-only change.
- Your evidence note separates ALB target health, Kubernetes port wiring, application health contract, owners, validation, and handoff.
