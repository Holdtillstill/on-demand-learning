# Full Lab: Review Kubernetes YAML Before Apply

## Goal

Review a vendor Kubernetes manifest before it reaches any shared cluster. The lab is intentionally file-first because the safest review is often the one that happens before `kubectl apply`.

## Time

30 to 45 minutes.

## Safety

Do not apply `vendor.yaml` to a shared cluster. It intentionally contains risky permissions and Pod settings.

## Starting State

```bash
bash labs/platform-academy/review-yaml-before-apply/setup.sh --evidence /tmp/yaml-review-evidence.md
sed -n '1,220p' labs/platform-academy/review-yaml-before-apply/vendor.yaml
sed -n '1,160p' labs/platform-academy/review-yaml-before-apply/evidence-template.md
```

Optional client-side parse check:

```bash
kubectl apply --dry-run=client --validate=false -f labs/platform-academy/review-yaml-before-apply/vendor.yaml
```

Run the local analyzer:

```bash
python3 labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py \
  --vendor labs/platform-academy/review-yaml-before-apply/vendor.yaml \
  --safe labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml
```

## Investigation

Find and record:

- Every resource kind.
- Every namespace.
- Any cluster-scoped resource.
- Any secret access.
- Any privileged container setting.
- Any hostPath mount.
- Any committed credential placeholder that could become a real secret later.
- Whether the local analyzer confirms the blocker categories and safer baseline.
- The vendor questions, safer baseline changes, and validation output you would save before approval.

## Compare

Compare against the safer baseline:

```bash
diff -u labs/platform-academy/review-yaml-before-apply/vendor.yaml labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml || true
```

## Validation

```bash
bash labs/platform-academy/review-yaml-before-apply/validate.sh
bash labs/platform-academy/review-yaml-before-apply/validate.sh --evidence /tmp/yaml-review-evidence.md
```

## Success Criteria

- You block the risky manifest before apply.
- You explain whether each blocker is RBAC, workload security, node filesystem exposure, or credential handling.
- You capture the local manifest risk analyzer result.
- You write precise questions back to the vendor.
- You keep a no-live-apply evidence note with the safer baseline comparison.
