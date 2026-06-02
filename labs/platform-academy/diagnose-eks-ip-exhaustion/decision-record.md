# EKS IP Exhaustion Decision Record

## Decision

Treat this as an EKS capacity incident, not an application restart problem.

## Evidence

- `FailedCreatePodSandBox` reports failed IP assignment.
- `aws-node` logs say `subnet-bbb222 has insufficient free IPv4 addresses`.
- The lowest subnet has `AvailableIPv4AddressCount=7`.
- Two nodes are at `runningPods=29` with `maxPods=29`.
- Prefix delegation is disabled on the node group.

## Rejected Actions

- Repeated Pod deletion: rejected because it adds churn without creating IP capacity.
- Blind node scaling: rejected until subnet IP headroom is confirmed.
- Ignoring zone imbalance: rejected because the lowest-free subnet can still block scheduling.

## Follow-Up

Create capacity alerts for subnet free IPs, node pod density, and CNI IP allocation errors before the next planned scale event.
