# Production EKS Launch Review

## Decision

Block production launch until the required reliability, cost, and upgrade-readiness gaps are owned and validated.

## Launch Blockers

- `payments/worker` has `pdb=missing`.
- `data/postgres` is zonal on `gp3-us-west-2a`; restore proof is required before launch.
- `apps-c` is missing a `cost-center` label.
- Controller add-ons have no documented version compatibility matrix.
- Deprecated API check is listed as a pause point but has no recorded output.

## Follow-Up Improvements

- Decide whether public endpoint access is required or should be narrowed.
- Automate idle LoadBalancer review.
- Add idle request and over-request reports.
- Document NAT gateway cost expectations.

## Owners

- Platform owner: endpoint posture, add-on compatibility, node groups, deprecated API checks.
- App owner: `payments/worker` PDB and rollout safety.
- Data owner: Postgres restore proof and RPO/RTO.
- FinOps owner: cost labels, NAT review, idle resources.

## Validation

- PDB exists for every critical workload.
- Restore drill proves the stateful recovery path.
- Every node group has cost labels.
- Upgrade checklist includes deprecated API scan and add-on compatibility matrix.
