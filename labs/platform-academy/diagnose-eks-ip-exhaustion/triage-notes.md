# Triage Notes: Pending Pods During EKS Scale-Out

## Evidence Source

These notes are a captured capacity incident handoff for the EKS IP exhaustion lab. Use them with `cluster-snapshot.txt`, `remediation-plan.md`, and `decision-record.md` when you do not have AWS or cluster access.

## Timeline

- 18:30 UTC: Checkout scale-out began after traffic increased.
- 18:34 UTC: New Pods started showing `FailedScheduling` with `Insufficient pods`.
- 18:36 UTC: Some scheduled Pods failed sandbox creation because the VPC CNI could not assign an IP address.
- 18:39 UTC: Subnet inventory showed `subnet-bbb222` with `AvailableIPv4AddressCount=7`.
- 18:43 UTC: Node inventory showed workers at or near maxPods with prefix delegation disabled.

## False Leads Ruled Out

- Restarting application Pods is not supported because the first failures happen before containers start.
- CPU or memory tuning is not the first fix because the scheduler event names pod-density pressure.
- Blind node scaling is risky because constrained subnet IP capacity can make new nodes fail to place enough Pods.
- A live CIDR or CNI setting change is out of scope without platform and network owner review.

## Strongest Clues

- `FailedScheduling` shows maxPods or pod-density pressure.
- `FailedCreatePodSandBox` plus aws-cni logs show IP assignment failure.
- `subnet-bbb222` has only seven available IPv4 addresses.
- Prefix delegation is disabled, so each Pod consumes an individual secondary IP.

## Evidence To Save

- Scheduler event and sandbox failure lines.
- aws-node/IPAM allocation error.
- Subnet IPv4 inventory.
- Node maxPods/runningPods summary.
- Rejected actions, owner split, remediation plan, analyzer result, validation signal, and rollback note.
