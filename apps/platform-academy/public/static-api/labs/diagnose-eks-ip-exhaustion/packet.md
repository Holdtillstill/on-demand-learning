# Diagnose EKS Pod IP exhaustion

Track: EKS
Level: Intermediate
Lab tier: full
Estimated time: 45 minutes

## Scenario

New Pods remain Pending during scale-out and events mention CNI allocation failures.

## Guided run sequence

1. Prepare workspace
   - No AWS credentials required; this lab uses a captured EKS evidence pack.
   - Run commands from the repository root so local evidence paths resolve.
   - bash labs/platform-academy/run-lab.sh setup diagnose-eks-ip-exhaustion
   - bash labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh --evidence /tmp/eks-ip-exhaustion-evidence.md
2. Investigate safely
   - Read triage-notes.md and rule out restart, CPU/memory, blind node scaling, and live capacity-change false leads.
   - Separate scheduler max-pod pressure from VPC CNI IP allocation errors.
   - Find the subnet with the lowest free IPv4 count.
   - Use the local analyzer to confirm the scheduler, CNI, subnet, maxPods, and prefix-delegation signals agree.
3. Prove the finding
   - The triage notes rule out app restarts, CPU/memory tuning, blind node scaling, and unreviewed live CIDR/CNI changes.
   - Events include FailedCreatePodSandBox with failed IP assignment.
   - One subnet has only seven available IPv4 addresses.
   - Nodes are near maxPods and prefix delegation is disabled.
4. Reset or hand off
   - bash labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh
   - Use triage-notes.md and the evidence pack as a captured incident transcript.
   - Write the decision note without running any cluster or AWS commands.

## Evidence artifact map

- `labs/platform-academy/diagnose-eks-ip-exhaustion/triage-notes.md` - Decision note
- `labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt` - Starting evidence
- `labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md` - Decision note
- `labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md` - Decision note
- `labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py` - Lab artifact
- `labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh` - Lab artifact
- `labs/platform-academy/diagnose-eks-ip-exhaustion/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh` - Self-check script
- `labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/diagnose-eks-ip-exhaustion/triage-notes.md
- labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
- labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md
- labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md
- labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py
- labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh
- labs/platform-academy/diagnose-eks-ip-exhaustion/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh
- labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh

## Worksheet prompts

- [ ] Record the cluster snapshot, namespace, rollout scale target, and confirmation that no AWS or cluster capacity change is being made.
- [ ] Read triage-notes.md and list the False Leads ruled out before recommending capacity changes.
- [ ] Paste the `FailedScheduling` and `Insufficient pods` evidence that shows scheduler pod-density pressure.
- [ ] Paste the `FailedCreatePodSandBox` and aws-cni IP allocation evidence.
- [ ] Paste `subnet-bbb222`, `AvailableIPv4AddressCount=7`, node maxPods/runningPods, and `prefix delegation disabled` evidence.
- [ ] Write the owner split across application scale, platform node groups/CNI, and network subnet planning.
- [ ] Write the staged remediation, rejected actions, validation signals, rollback note, and saved evidence packet.

## Prerequisites

- [ ] No AWS credentials required; this lab uses a captured EKS evidence pack.
- [ ] Run commands from the repository root so local evidence paths resolve.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup diagnose-eks-ip-exhaustion
- bash labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh --evidence /tmp/eks-ip-exhaustion-evidence.md
- sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/triage-notes.md
- sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup diagnose-eks-ip-exhaustion --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace diagnose-eks-ip-exhaustion --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip diagnose-eks-ip-exhaustion-learner-workspace.zip
- cd diagnose-eks-ip-exhaustion
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read triage-notes.md and rule out restart, CPU/memory, blind node scaling, and live capacity-change false leads.
- [ ] Separate scheduler max-pod pressure from VPC CNI IP allocation errors.
- [ ] Find the subnet with the lowest free IPv4 count.
- [ ] Use the local analyzer to confirm the scheduler, CNI, subnet, maxPods, and prefix-delegation signals agree.
- [ ] Decide whether prefix delegation, node group sizing, or CIDR planning is the correct owner path.

## Runbook commands

- grep -n "False Leads\|Blind node scaling\|FailedCreatePodSandBox" labs/platform-academy/diagnose-eks-ip-exhaustion/triage-notes.md
- grep -n "FailedCreatePodSandBox\|failed to assign IP\|AvailableIPv4AddressCount" labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
- grep -n "maxPods\|runningPods\|prefix delegation" labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
- sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md

## Expected evidence

- [ ] The triage notes rule out app restarts, CPU/memory tuning, blind node scaling, and unreviewed live CIDR/CNI changes.
- [ ] Events include FailedCreatePodSandBox with failed IP assignment.
- [ ] One subnet has only seven available IPv4 addresses.
- [ ] Nodes are near maxPods and prefix delegation is disabled.
- [ ] The local analyzer reports EKS IP exhaustion analysis passed.
- [ ] The remediation plan separates app, platform, network, and release ownership.

## Validation commands

- bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh
- bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh --evidence /tmp/eks-ip-exhaustion-evidence.md
- python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt
- grep -n "not an application restart problem" labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md

## Validation checks

- [ ] No-live-capacity-change safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] EKS IP exhaustion analysis passed output captured
- [ ] FailedScheduling pod-density evidence captured
- [ ] FailedCreatePodSandBox CNI evidence captured
- [ ] Subnet IPv4 exhaustion evidence captured
- [ ] Nodes near maxPods and prefix delegation evidence captured
- [ ] Owner split and staged remediation recorded
- [ ] Validation output and rollback/no-credential evidence recorded

## Rubric

- [ ] Preserves the no-live-capacity-change safety boundary and names the reviewed rollout.
- [ ] Uses triage notes to rule out app restarts, CPU/memory tuning, blind node scaling, and live CNI/CIDR False Leads.
- [ ] Separates `FailedScheduling` pod-density evidence from application health assumptions.
- [ ] Connects `FailedCreatePodSandBox` and aws-cni logs to IP allocation failure.
- [ ] Identifies `subnet-bbb222`, `AvailableIPv4AddressCount=7`, maxPods pressure, and `prefix delegation disabled`.
- [ ] Separates application, platform/CNI, and network owners before recommending capacity changes.
- [ ] Rejects blind restarts or blind node scaling and records validation, rollback, and capacity-alert evidence.

## Cleanup commands

- bash labs/platform-academy/diagnose-eks-ip-exhaustion/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md and the evidence pack as a captured incident transcript.
- [ ] Write the decision note without running any cluster or AWS commands.
