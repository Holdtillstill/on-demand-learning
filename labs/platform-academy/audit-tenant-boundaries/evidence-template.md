# Evidence Template: Audit Kubernetes Tenant Boundaries

## Scope And Safety

- Manifest reviewed:
- Tenant namespace:
- Confirmation that the risky manifest was not applied to a shared cluster:
- Cleanup command if a disposable cluster was used:

## RBAC Evidence

- ClusterRoleBinding:
- Bound subject:
- ClusterRole:
- Secret access rule:
- Why this breaks tenant isolation:

## Pod Security Evidence

- Current enforcement level:
- Required enforcement level:
- Exception owner and expiry, if any:

## NetworkPolicy Evidence

- Policy name:
- Egress rule:
- Why this is not default-deny:
- Safer target policy:

## Onboarding Decision

- Local tenant boundary analyzer result:
- Decision:
- Blocking findings:
- Required changes:
- Owner and expiry for exceptions:
- Evidence to save:
