# Solution: Diagnose EKS Pod IP Exhaustion

## Decision

Pause the scale-up and escalate to platform/network ownership for VPC CNI capacity. Do not restart Pods as the primary mitigation.

## Findings

- Scheduler events show `Insufficient pods`, which points to maxPods or pod-density pressure.
- Sandbox creation events and `aws-node` logs show IP allocation failure.
- `subnet-bbb222` has only seven available IPv4 addresses.
- Nodes are at 29/29, 28/29, and 29/29 running Pods.
- Prefix delegation is disabled.

## Safer Target

`remediation-plan.md` separates immediate safety, owner path, medium-term fixes, validation, and rollback.

## Evidence to Save

Save the event lines, node pod-density summary, subnet inventory, `aws-node` logs, owner split, validation output, and the decision record in `evidence-template.md`.

## Cleanup

No cleanup is required for the default evidence-review path.
