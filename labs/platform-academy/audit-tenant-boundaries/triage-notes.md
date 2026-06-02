# Triage Notes: Tenant Boundary Onboarding Review

## Evidence Source

These notes are a captured platform/security review packet for the tenant boundary lab. Use them with `tenant-a.yaml`, `fixed-tenant-a.yaml`, and `review.md` when you do not have a disposable cluster.

## Timeline

- 13:20 UTC: Tenant A requested onboarding to the shared cluster before a launch rehearsal.
- 13:27 UTC: Platform review found a temporary ClusterRoleBinding named `tenant-a-temporary-admin`.
- 13:32 UTC: Security review found the `app-reader` Role can get, list, and watch `secrets`.
- 13:40 UTC: The namespace Pod Security label was confirmed as `baseline`.
- 13:45 UTC: Network review found `allow-all-egress`, which only proves that a policy object exists, not that egress is isolated.
- 13:52 UTC: Onboarding was blocked until the safer manifest and exception ownership are documented.

## False Leads Ruled Out

- A temporary cluster-admin binding is not safe just because it is for onboarding; it still creates a platform-admin path.
- Secret reads are not acceptable as a debugging convenience without scoped ownership, audit, and expiry.
- A NetworkPolicy object is not a boundary when it contains an empty egress rule.
- Pod Security `baseline` is not the target for a new tenant namespace unless an approved exception exists.
- Client-side dry-run proves YAML parseability, not tenant isolation.

## Strongest Clues

- `tenant-a-temporary-admin` binds `system:serviceaccount:tenant-a:deployer` to `cluster-admin`.
- `app-reader` grants `get`, `list`, and `watch` on `secrets`.
- The namespace enforces `pod-security.kubernetes.io/enforce: baseline`.
- `allow-all-egress` uses `egress: - {}`, which allows all outbound traffic.
- `fixed-tenant-a.yaml` removes the ClusterRoleBinding, removes secret access, enforces `restricted`, and starts with default-deny egress.

## Evidence To Save

- Manifest name, tenant namespace, and shared-cluster safety boundary.
- RBAC subject, role reference, and secret access rule.
- Pod Security baseline versus restricted target.
- NetworkPolicy false-boundary evidence and default-deny target.
- Analyzer output, onboarding block decision, exception owner, expiry date, validation, and cleanup or no-runtime note.
