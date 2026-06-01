# Full Lab: Diagnose EKS Pod IP Exhaustion

## Goal

Separate Kubernetes scheduler pressure from AWS VPC CNI IP exhaustion, then write the safest owner path for restoring capacity.

## Time

45 to 60 minutes.

## Safety

No AWS credentials or cluster access are required. Use the captured evidence pack as an incident transcript. Do not scale real node groups, edit CNI settings, or change subnet CIDRs from this lab.

## Starting State

Inspect the evidence:

```bash
sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
sed -n '1,180p' labs/platform-academy/diagnose-eks-ip-exhaustion/evidence-template.md
```

Review the remediation target:

```bash
sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md
```

## Investigation

Find:

- FailedScheduling evidence versus failed Pod sandbox evidence.
- Which subnet has the lowest available IPv4 count.
- Whether nodes are at or near maxPods.
- Whether prefix delegation is enabled.
- Which team owns workload scale, node group capacity, CNI settings, and subnet planning.
- Which evidence proves this is not an application restart or blind node-scaling problem.

## Remediation Target

Use `remediation-plan.md` and `decision-record.md` as the target answer. The correct outcome is not "just add nodes"; it is a staged capacity decision with owner, validation, and rollback.

## Validation

```bash
bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh
bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh --evidence /tmp/eks-ip-exhaustion-evidence.md
```

## Success Criteria

- You identify `subnet-bbb222` as the most constrained subnet.
- You separate maxPods pressure from subnet IP exhaustion.
- You explain why prefix delegation, subnet capacity, and node-group sizing are separate decisions.
- You produce a no-credential incident note that a platform owner could act on.
- You assign application, platform, and network owners with validation and rollback evidence.
