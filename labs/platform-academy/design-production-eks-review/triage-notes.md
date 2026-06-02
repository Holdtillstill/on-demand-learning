# Production EKS Review Triage Notes

## False Leads Ruled Out

- A public and private endpoint is not launch approval; endpoint posture still needs an access decision, CIDR review, and operational owner.
- One missing PDB is not a follow-up when the workload is marked critical and has only one replica in one Availability Zone.
- A snapshot policy is not restore proof; launch needs a restore drill result, an owner, and a recovery objective.
- Cost labels are not optional after launch because unlabeled shared nodes hide ownership and delay FinOps cleanup.
- Managed controller add-ons do not remove upgrade risk when no compatibility matrix is attached.

## Strong Evidence

- `cluster-review.md` shows `Endpoint: public and private`, `payments/worker` with `pdb=missing`, and `data/postgres` using `volume=gp3-us-west-2a`.
- `cluster-review.md` also records `Missing cost label on apps-c` and an upgrade pause around deprecated APIs and controller add-ons.
- `launch-review.md` blocks production launch until reliability, recovery, cost, and upgrade gaps have owners and validation criteria.

## Decision Trap

Do not approve the launch because most resources are managed or because the review is read-only. The correct output is a blocked launch decision with owners, validation criteria, and evidence that can be reviewed without AWS access.
