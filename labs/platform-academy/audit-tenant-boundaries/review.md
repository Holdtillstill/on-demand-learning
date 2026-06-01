# Tenant Boundary Review

Findings to confirm:

- The tenant has a temporary `cluster-admin` ClusterRoleBinding.
- The namespaced Role can list and watch secrets.
- The NetworkPolicy allows all egress, so it is not a default-deny boundary.
- Pod Security is set to `baseline`, not `restricted`.

Recommended outcome:

Block onboarding until the temporary admin path is removed, secret access is narrowed, egress is scoped, and exceptions have owners and expiry dates.
