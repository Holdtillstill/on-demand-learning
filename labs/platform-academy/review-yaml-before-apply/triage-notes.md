# Triage Notes: Vendor Manifest Before Apply

## Evidence Source

These notes are a captured pre-apply review handoff for the Kubernetes YAML review lab. Use them with `vendor.yaml`, `safe-baseline.yaml`, and the evidence template when you do not have kubectl or a cluster.

## Timeline

- 10:12 UTC: Vendor submitted a manifest bundle for a monitoring agent pilot.
- 10:18 UTC: Reviewer confirmed the bundle includes namespaced workload objects and cluster-scoped RBAC.
- 10:23 UTC: Security review found secret read permissions, privileged mode, and a host root filesystem mount.
- 10:29 UTC: The Secret stub still contained `stringData.token`, which could become a real credential in later environments.
- 10:34 UTC: Safer baseline review showed the agent can be represented without cluster-wide secret access, privileged runtime, or hostPath.

## False Leads Ruled Out

- Client-side dry-run is not approval; it proves YAML parses, not that RBAC and workload settings are safe.
- A namespace field is not enough isolation when the bundle also creates a ClusterRole.
- A sandbox-only apply is not the first step because the risky intent is visible before any cluster mutation.
- Treating `stringData.token` as harmless placeholder practice is unsafe because the same pattern often becomes real environment data.

## Strongest Clues

- The ClusterRole can get, list, and watch `secrets`.
- The Deployment requests `privileged: true`.
- The Pod mounts the host root filesystem with `hostPath: /`.
- The safer baseline removes these blockers and keeps the review in source before apply.

## Evidence To Save

- Resource inventory and namespace scope.
- ClusterRole secret access evidence.
- Privileged and hostPath evidence.
- Secret placeholder handling decision.
- Safer baseline diff, vendor questions, analyzer result, and no-live-apply note.
