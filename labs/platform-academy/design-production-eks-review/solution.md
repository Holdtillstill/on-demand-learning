# Solution: Run a Production EKS Architecture Review

## Decision

Block launch until required owners close the PDB, restore, cost-label, and upgrade-readiness gaps.

## Findings

- The cluster endpoint is both public and private, which needs an explicit access decision.
- `payments/worker` has one replica in one AZ and no PDB.
- `data/postgres` uses zonal storage and depends on snapshot restore.
- `apps-c` is missing a cost label.
- Upgrade pause points exist, but compatibility and deprecated API evidence are not attached.

## Evidence to Save

Save the critical workload table, endpoint posture, missing PDB, zonal storage, cost/guardrail lines, upgrade pause points, launch blockers, owners, validation criteria, local analyzer output, and no-AWS note in `evidence-template.md`.

The local production review analyzer reports `Production EKS review analysis passed`.

## Cleanup

No cleanup is required for the default architecture-review path.
