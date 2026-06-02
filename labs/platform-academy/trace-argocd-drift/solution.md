# Solution: Trace an ArgoCD Drift Report

## Diagnosis

`argocd-app-report.txt` shows `Sync Status: OutOfSync` for `payments/checkout` while health remains `Healthy`.

Git declares:

```yaml
replicas: 3
```

The live Deployment has:

```yaml
replicas: 9
```

The live object also includes autoscaling metadata, so this is likely expected controller-owned state rather than a human hotfix.

The report also shows `selfHeal: true`. If ArgoCD self-heals before ownership is decided, it can force the Deployment back to Git's replica count and fight the autoscaler.

## Decision

If an HPA or autoscaler owns replica count, configure ArgoCD to ignore only `/spec/replicas` for the `checkout` Deployment. Do not ignore the full object.

The local drift analyzer checks that exact boundary:

```bash
python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py \
  --desired labs/platform-academy/trace-argocd-drift/desired.yaml \
  --live labs/platform-academy/trace-argocd-drift/live.yaml \
  --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml \
  --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
```

## Why Narrow Scope Matters

ArgoCD should still detect drift in image, resource requests, labels, probes, security context, and other production-owned fields. A broad ignore rule would hide real incidents.

The triage notes rule out force-sync, global self-heal changes, whole-Deployment ignore rules, and treating every OutOfSync report as human hotfix drift.

## Handoff Note

A good handoff says: `triage-notes.md` rules out force-sync, global self-heal changes, whole-Deployment ignore rules, and treating every OutOfSync report as human hotfix drift. `argocd-app-report.txt` reports `OutOfSync` on `/spec/replicas`; Git declares `replicas: 3`, live state has `replicas: 9`, `selfHeal: true` could fight autoscaling, and the live object has autoscaling metadata. The drift analyzer confirms the Git-owned image and resource requests still match Git. If the autoscaler owns replicas, ignore only `/spec/replicas` for `payments/checkout`; keep image, labels, resources, probes, and security settings Git-owned.

## Remediation Target

`ignore-differences.yaml` scopes the ignore rule to:

- group: `apps`
- kind: `Deployment`
- name: `checkout`
- namespace: `payments`
- json pointer: `/spec/replicas`

## Cleanup

No cleanup is required for the default captured-manifest path.
