# Full Lab: Trace an ArgoCD Drift Report

## Goal

Decide whether an ArgoCD OutOfSync report is real unmanaged drift or an expected controller-owned field. The lab uses captured desired and live manifests so no ArgoCD server is required.

## Time

35 to 50 minutes.

## Safety

No ArgoCD server or cluster access is required. Use the captured manifests only, and do not force-sync or add broad ignore rules to a real application from this lab.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
sed -n '1,220p' labs/platform-academy/trace-argocd-drift/desired.yaml
sed -n '1,220p' labs/platform-academy/trace-argocd-drift/live.yaml
diff -u labs/platform-academy/trace-argocd-drift/desired.yaml labs/platform-academy/trace-argocd-drift/live.yaml || true
cp labs/platform-academy/trace-argocd-drift/evidence-template.md /tmp/argocd-drift-evidence.md
```

## Investigation

Find:

- The exact field ArgoCD reports as drift.
- The sync policy risk if `selfHeal` keeps fighting the controller-owned field.
- Whether the live change looks controller-owned.
- Which fields should remain Git-owned.
- Whether `selfHeal` would fight an autoscaler.
- How narrow the ignore rule should be if autoscaling owns replicas.

## Remediation Target

Review the proposed narrow ignore rule:

```bash
sed -n '1,180p' labs/platform-academy/trace-argocd-drift/ignore-differences.yaml
```

## Validation

```bash
bash labs/platform-academy/trace-argocd-drift/validate.sh
bash labs/platform-academy/trace-argocd-drift/validate.sh --evidence /tmp/argocd-drift-evidence.md
```

## Success Criteria

- You name `.spec.replicas` as the drift field.
- You do not ignore the whole Deployment.
- You keep image, labels, resources, and security settings owned by Git.
- You write a field-owner decision instead of blindly forcing sync.
- Your evidence note names desired/live replica values, controller ownership signal, narrow ignore rule, Git-owned fields, owner, and validation evidence.
