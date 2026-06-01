# Full Lab: Debug an AWS ALB Health Path

## Goal

Use captured ALB target health, Kubernetes Ingress/Service YAML, and controller events to identify why one target is unhealthy. The default path needs no AWS account; an optional disposable-cluster mode creates the broken Kubernetes objects locally.

## Time

35 to 55 minutes.

## Safety

No AWS account is required. This lab uses local exported evidence and a client-side Kubernetes parse check by default. If you use `--cluster`, run it only against kind, minikube, Docker Desktop, Rancher Desktop, or another approved sandbox.

## Starting State

```bash
bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --evidence /tmp/alb-health-path-evidence.md
sed -n '1,220p' labs/platform-academy/debug-aws-alb-health-path/triage-notes.md
sed -n '1,220p' labs/platform-academy/debug-aws-alb-health-path/target-health.json
sed -n '1,260p' labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
sed -n '1,160p' labs/platform-academy/debug-aws-alb-health-path/events.txt
```

Setup creates the broken cluster state or stages the captured ALB/controller packet, but it does not run the analyzer by default. Run the local analyzer after you inspect target-health, event, health-path, and targetPort evidence, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py \
  --target-health labs/platform-academy/debug-aws-alb-health-path/target-health.json \
  --events labs/platform-academy/debug-aws-alb-health-path/events.txt \
  --broken labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml \
  --fixed labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml
```

Optional parse check:

```bash
kubectl create --dry-run=client --validate=false -f labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
```

Optional local broken-state setup:

```bash
bash labs/platform-academy/bootstrap-local-cluster.sh --preflight debug-aws-alb-health-path
bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --preflight
bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --cluster --evidence /tmp/alb-health-path-evidence.md
```

## Investigation

Find:

- The ALB target health reason.
- The configured ALB health check path.
- The Service target port.
- The Pod port name.
- Any controller event that names the mismatch.
- Whether the application path also returns a 404.
- Which false leads the triage notes rule out before changing ALB or Kubernetes objects.
- Whether the local analyzer confirms health-path, Service/Pod, and owner evidence.

## Remediation Target

```bash
diff -u labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml || true
```

## Validation

```bash
bash labs/platform-academy/debug-aws-alb-health-path/validate.sh
bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence /tmp/alb-health-path-evidence.md
bash labs/platform-academy/run-lab.sh validate debug-aws-alb-health-path --cluster
bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --cluster
bash labs/platform-academy/debug-aws-alb-health-path/cleanup.sh
```

## Success Criteria

- You identify `Target.ResponseCodeMismatch`.
- You identify the `targetPort: web` mismatch.
- You explain why `/healthz` returning 404 also needs owner confirmation.
- You propose a source-manifest fix rather than a console-only change.
- You capture the local ALB health analyzer result.
- Your evidence note separates triage false leads, ALB target health, Kubernetes port wiring, application health contract, owners, validation, and handoff.
