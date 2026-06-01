# Full Lab: Audit Kubernetes Tenant Boundaries

## Goal

Review a proposed tenant namespace before onboarding. The starting manifest intentionally includes broad RBAC, secret access, weak Pod Security posture, and an egress policy that looks like a boundary but allows everything.

## Time

45 to 60 minutes.

## Safety

Do not apply `tenant-a.yaml` to a shared cluster. The default path is manifest review and client-side dry-run only. If you use `--cluster`, run it only against kind, minikube, Docker Desktop, Rancher Desktop, or another approved sandbox because the risky manifest creates a cluster-scoped binding.

## Starting State

```bash
bash labs/platform-academy/audit-tenant-boundaries/setup.sh --evidence /tmp/tenant-boundaries-evidence.md
sed -n '1,240p' labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
sed -n '1,180p' labs/platform-academy/audit-tenant-boundaries/review.md
```

Optional parse check:

```bash
kubectl create --dry-run=client --validate=false -f labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
```

Optional local broken-state setup:

```bash
bash labs/platform-academy/audit-tenant-boundaries/setup.sh --cluster --evidence /tmp/tenant-boundaries-evidence.md
```

## Investigation

Find:

- Any ClusterRoleBinding.
- Any `cluster-admin` path.
- Any permission to read secrets.
- Pod Security level.
- Whether NetworkPolicy actually blocks egress.
- Which exception needs an owner and expiry date.

## Remediation Target

Compare the proposed safer version:

```bash
diff -u labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml || true
```

## Validation

```bash
bash labs/platform-academy/audit-tenant-boundaries/validate.sh
bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence /tmp/tenant-boundaries-evidence.md
bash labs/platform-academy/audit-tenant-boundaries/validate.sh --cluster
bash labs/platform-academy/audit-tenant-boundaries/cleanup.sh
```

## Success Criteria

- You block onboarding until broad admin and secret access are removed.
- You identify the false boundary in the allow-all egress NetworkPolicy.
- You propose a restricted baseline with documented exceptions.
- Your evidence note names RBAC, secret access, Pod Security, egress, owner/expiry, onboarding decision, validation, and cleanup or no-runtime-review evidence.
