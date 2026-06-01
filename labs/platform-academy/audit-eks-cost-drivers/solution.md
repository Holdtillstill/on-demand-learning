# Solution: Audit EKS Cost Drivers

## Decision

Start with owner cleanup and right-sizing proposals. Do not delete shared resources until ownership, traffic, and rollback are confirmed.

## Findings

- `payments/checkout` and `payments/worker` request far more CPU and memory than they use.
- `default/load-test` has zero CPU and memory usage with owner `unknown`.
- `default/abandoned-demo` is a LoadBalancer with estimated monthly cost.
- `default/abandoned-cache` is a 200Gi gp2 PVC with owner `unknown`.
- Observability and data workloads are expensive but have owners and should be treated as architecture review items, not quick deletes.

## Evidence to Save

Save the usage rows, service list, storage list, recommendation table, owner assignments, expected savings, reliability risk, rollback notes, review cadence, and no-AWS note in `evidence-template.md`.

## Cleanup

No cleanup is required for the default cost-evidence path.
