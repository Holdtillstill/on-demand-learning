# Solution: Diagnose EKS Pod IP Exhaustion

## Decision

Pause the scale-up and escalate to platform/network ownership for VPC CNI capacity. Do not restart Pods as the primary mitigation.

## Findings

- Scheduler events show `Insufficient pods`, which points to maxPods or pod-density pressure.
- Sandbox creation events and `aws-node` logs show IP allocation failure.
- `subnet-bbb222` has only seven available IPv4 addresses.
- Nodes are at 29/29, 28/29, and 29/29 running Pods.
- Prefix delegation is disabled.
- The triage notes rule out application Pod restarts, CPU/memory tuning, blind node scaling, and unreviewed live CIDR/CNI changes.

## Safer Target

`remediation-plan.md` separates immediate safety, owner path, medium-term fixes, validation, and rollback.

## Local Analyzer

The local IP exhaustion analyzer verifies the same split without AWS credentials:

```bash
python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py \
  --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
```

Expected result: `EKS IP exhaustion analysis passed`, with scheduler pressure, VPC CNI pressure, `subnet-bbb222`, nodes near maxPods, and prefix delegation disabled.

## Evidence to Save

Save the triage false leads, event lines, node pod-density summary, subnet inventory, `aws-node` logs, local IP exhaustion analyzer output, owner split, validation output, and the decision record in `evidence-template.md`.

## Cleanup

No cleanup is required for the default evidence-review path.
