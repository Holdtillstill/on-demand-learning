# Triage Notes: ArgoCD OutOfSync Replica Drift

## Evidence Source

These notes are a captured GitOps ownership handoff for the ArgoCD drift lab. Use them with `argocd-app-report.txt`, `desired.yaml`, `live.yaml`, `ownership-decision.md`, and `ignore-differences.yaml` when you do not have ArgoCD access.

## Timeline

- 15:06 UTC: ArgoCD reported `payments/checkout` as `OutOfSync` while health stayed `Healthy`.
- 15:09 UTC: Desired manifest showed `replicas: 3`.
- 15:11 UTC: Live Deployment showed `replicas: 9` and autoscaling metadata.
- 15:14 UTC: Report showed `selfHeal: true`, which could reduce replicas if ArgoCD owns the field.
- 15:18 UTC: Review confirmed image and resource fields still match Git.

## False Leads Ruled Out

- Force-sync is not the first action because it can fight autoscaling and reduce capacity.
- Disabling self-heal globally is too broad; it weakens drift protection for unrelated fields.
- Ignoring the whole Deployment is unsafe because image, labels, resources, probes, and security settings must remain Git-owned.
- Treating all OutOfSync status as human hotfix drift misses controller-owned field patterns.

## Strongest Clues

- The exact drift field is `/spec/replicas`.
- Desired state wants three replicas; live state has nine.
- Live metadata shows autoscaling ownership.
- The proposed ignore rule is scoped to checkout in payments and only `/spec/replicas`.

## Evidence To Save

- ArgoCD report status and self-heal setting.
- Desired/live replica values.
- Autoscaling ownership signal.
- Git-owned fields that must remain enforced.
- Narrow ignore rule, analyzer result, owner decision, and validation handoff.
