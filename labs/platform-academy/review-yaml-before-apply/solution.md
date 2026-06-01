# Solution: Review Kubernetes YAML Before Apply

## Blockers

The vendor manifest should be blocked for production or shared-cluster use.

Main findings:

- `ClusterRole` can get, list, and watch `secrets`.
- The Deployment runs a privileged container.
- The Deployment mounts the host root filesystem with `hostPath: /`.
- `stringData.token` is present in a Secret stub and could accidentally become a real committed credential.

## Decision

Approve only a safer, namespaced variant after the vendor removes cluster-scoped secret access, privileged mode, and hostPath access. Any real credential should be provisioned through the platform's secret delivery path, not committed in a manifest.

## Safer Baseline

`safe-baseline.yaml` keeps the namespace and workload shape but removes the high-risk resources and adds basic container hardening:

- `allowPrivilegeEscalation: false`
- `readOnlyRootFilesystem: true`

## Review Questions

- Why does the agent need secret access?
- Can permissions be namespaced and resource-specific?
- Why does the agent need host filesystem access?
- Can the workload run without privileged mode?
- How should the token be injected in each environment?

## Evidence to Save

Save the manifest inventory, ClusterRole secret access, privileged container, hostPath mount, Secret `stringData.token`, safer baseline diff, vendor questions, validation output, and no-live-apply note in `evidence-template.md`.

## Cleanup

No cluster cleanup is required for the file-review path. If you used `kubectl create --dry-run=client`, there should be no live objects to delete.
