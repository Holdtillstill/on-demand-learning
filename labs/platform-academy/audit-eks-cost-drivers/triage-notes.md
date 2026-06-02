# Triage Notes: EKS Cost Driver Review

## Evidence Source

These notes are a captured FinOps/platform review for the EKS cost-driver lab. Use them with `usage.csv`, `services.txt`, `storage.txt`, and `recommendations.md` when AWS Cost Explorer or a live cluster is unavailable.

## Timeline

- 15:05 UTC: Finance asked for a quick EKS savings review before month close.
- 15:12 UTC: `payments/checkout` and `payments/worker` were flagged as over-requested compared with observed usage.
- 15:18 UTC: `default/load-test` showed zero usage and owner `unknown`.
- 15:23 UTC: `default/abandoned-demo` appeared as an old LoadBalancer with monthly exposure.
- 15:27 UTC: `default/abandoned-cache` appeared as a 200Gi gp2 PVC with unknown ownership.
- 15:35 UTC: Observability and data workloads were kept out of quick-delete scope and moved to architecture review.

## False Leads Ruled Out

- Low utilization is not automatic deletion approval.
- Unknown owner means pause and confirm ownership, not delete faster.
- LoadBalancer age is not enough; traffic, DNS, and rollback path still matter.
- PVC cleanup needs restore expectations and data owner confirmation.
- Expensive observability or data workloads are architecture-review items, not quick wins.
- Savings without reliability risk and rollback is not an actionable recommendation.

## Strongest Clues

- `payments/checkout` and `payments/worker` have high request-to-usage ratios.
- `default/load-test` is idle and has owner `unknown`.
- `default/abandoned-demo` is an abandoned LoadBalancer candidate.
- `default/abandoned-cache` is unknown-owner storage waste.
- `recommendations.md` includes owner, expected savings, reliability risk, rollback, and review cadence.

## Evidence To Save

- Over-request rows, unknown-owner rows, usage/request ratio, and reliability risk.
- Abandoned LoadBalancer and PVC evidence, estimated monthly cost, and architecture-review exceptions.
- Analyzer output, ranked recommendation, owner, expected savings, rollback, review cadence, validation, and no-AWS note.
