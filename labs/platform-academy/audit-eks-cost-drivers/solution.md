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

The local EKS cost analyzer verifies the ranking without AWS credentials:

```bash
python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py \
  --usage labs/platform-academy/audit-eks-cost-drivers/usage.csv \
  --services labs/platform-academy/audit-eks-cost-drivers/services.txt \
  --storage labs/platform-academy/audit-eks-cost-drivers/storage.txt \
  --recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md
```

Expected result: `EKS cost driver analysis passed`, with compute right-size candidates, `default/load-test`, `default/abandoned-demo`, `default/abandoned-cache`, architecture-review items, and quick-win monthly exposure.

Save the usage rows, service list, storage list, recommendation table, local EKS cost analyzer output, owner assignments, expected savings, reliability risk, rollback notes, review cadence, and no-AWS note in `evidence-template.md`.

## Cleanup

No cleanup is required for the default cost-evidence path.
