# Solution: Audit Kubernetes Tenant Boundaries

## Findings

The tenant should not be onboarded with the starting manifest.

The triage notes are part of the solution because they prevent four tempting shortcuts: approving temporary cluster-admin for onboarding, treating secret access as debugging convenience, mistaking a NetworkPolicy object for isolation, and treating dry-run as a security review.

Blocking findings:

- `tenant-a-temporary-admin` binds the tenant service account to `cluster-admin`.
- The namespaced Role allows `get`, `list`, and `watch` on secrets.
- Pod Security is set to `baseline`, not `restricted`.
- `allow-all-egress` uses an empty egress rule, so it allows all outbound traffic.

## Decision

Block onboarding until:

- The temporary admin binding is removed.
- Secret access is removed or narrowed to explicit owned resources.
- Pod Security is set to `restricted` unless an exception is approved.
- Egress is default-deny first, then opened only to required destinations.
- Any exception has an owner, expiry date, and review path.

## Safer Target

`fixed-tenant-a.yaml` removes the ClusterRoleBinding, drops secret access, sets Pod Security enforcement to `restricted`, and replaces allow-all egress with default-deny egress.

The local tenant boundary analyzer verifies the block decision without a cluster:

```bash
python3 labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py \
  --broken labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml \
  --fixed labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml \
  --review labs/platform-academy/audit-tenant-boundaries/review.md
```

Expected result: `Tenant boundary analysis passed`, with RBAC risk, secret risk, Pod Security risk, NetworkPolicy risk, safer target, and blocked onboarding decision.

## Evidence to Save

Save the diff, the specific RBAC resources, local tenant boundary analyzer output, and the onboarding decision. This is the kind of artifact that is useful in a platform/security portfolio because it shows risk judgment, not just command use.

## Handoff Note

A good handoff says: block onboarding because `tenant-a-temporary-admin` binds `deployer` to `cluster-admin`, the Role can read secrets, Pod Security is only `baseline`, and `allow-all-egress` is not a boundary. The safer target removes cluster-admin and secret access, enforces `restricted`, and starts with default-deny egress plus documented exceptions.

## Cleanup

If you tested the manifests in a disposable cluster, run `bash labs/platform-academy/audit-tenant-boundaries/cleanup.sh` to remove the `tenant-a` namespace and the temporary cluster-scoped binding. If you only reviewed the files, no runtime cleanup is needed.
