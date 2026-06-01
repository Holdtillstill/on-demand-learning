# Run a production EKS architecture review

Track: EKS Architecture
Level: Advanced
Lab tier: full
Estimated time: 55 minutes

## Scenario

You need to review whether a proposed EKS platform is resilient and cost-aware before launch.

## Guided run sequence

1. Prepare workspace
   - No AWS account required; this lab uses a proposal snapshot.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup design-production-eks-review
   - bash labs/platform-academy/design-production-eks-review/setup.sh --evidence /tmp/production-eks-review-evidence.md
2. Investigate safely
   - Check critical workload spread and PDB coverage.
   - Identify zonal storage and recovery expectations.
   - Flag missing cost labels and upgrade pause points.
   - Run the local production review analyzer and connect its output to the launch decision.
3. Prove the finding
   - One worker has a missing PDB.
   - Postgres uses zonal storage with snapshot restore expectations.
   - One apps node lacks a cost label.
   - The local analyzer reports Production EKS review analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/design-production-eks-review/cleanup.sh
   - Use cluster-review.md as the design review packet.
   - Write launch blockers and follow-up owners without connecting to AWS.

## Evidence artifact map

- `labs/platform-academy/design-production-eks-review/cluster-review.md` - Decision note
- `labs/platform-academy/design-production-eks-review/launch-review.md` - Decision note
- `labs/platform-academy/design-production-eks-review/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/design-production-eks-review/production_review_analyzer.py` - Lab artifact
- `labs/platform-academy/design-production-eks-review/setup.sh` - Lab artifact
- `labs/platform-academy/design-production-eks-review/validate.sh` - Self-check script
- `labs/platform-academy/design-production-eks-review/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/design-production-eks-review/cluster-review.md
- labs/platform-academy/design-production-eks-review/launch-review.md
- labs/platform-academy/design-production-eks-review/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/design-production-eks-review/production_review_analyzer.py
- labs/platform-academy/design-production-eks-review/setup.sh
- labs/platform-academy/design-production-eks-review/validate.sh
- labs/platform-academy/design-production-eks-review/cleanup.sh

## Worksheet prompts

- [ ] Record the cluster-review packet, launch-review packet, reviewer, and confirmation that no AWS changes are being made.
- [ ] Paste endpoint posture, critical workload spread, missing PDB, and zonal storage evidence.
- [ ] Paste missing cost label, idle/NAT/LoadBalancer review gap, deprecated API, and add-on compatibility evidence.
- [ ] Separate immediate launch blockers from follow-up improvements and explain the reliability risk.
- [ ] Assign workload, platform, data, cost, and upgrade owners with validation criteria.
- [ ] Capture launch decision, analyzer output, validation output, cleanup, and no-AWS evidence packet.

## Prerequisites

- [ ] No AWS account required; this lab uses a proposal snapshot.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup design-production-eks-review
- bash labs/platform-academy/design-production-eks-review/setup.sh --evidence /tmp/production-eks-review-evidence.md
- sed -n '1,220p' labs/platform-academy/design-production-eks-review/cluster-review.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace design-production-eks-review --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip design-production-eks-review-learner-workspace.zip
- cd design-production-eks-review
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Check critical workload spread and PDB coverage.
- [ ] Identify zonal storage and recovery expectations.
- [ ] Flag missing cost labels and upgrade pause points.
- [ ] Run the local production review analyzer and connect its output to the launch decision.

## Runbook commands

- grep -n "Missing cost label\|pdb=missing\|public and private\|zonal" labs/platform-academy/design-production-eks-review/cluster-review.md
- grep -n "Upgrade pause\|deprecated APIs\|PDBs" labs/platform-academy/design-production-eks-review/cluster-review.md
- sed -n '1,220p' labs/platform-academy/design-production-eks-review/launch-review.md
- python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py --review labs/platform-academy/design-production-eks-review/cluster-review.md --launch labs/platform-academy/design-production-eks-review/launch-review.md

## Expected evidence

- [ ] One worker has a missing PDB.
- [ ] Postgres uses zonal storage with snapshot restore expectations.
- [ ] One apps node lacks a cost label.
- [ ] The local analyzer reports Production EKS review analysis passed.
- [ ] The launch review blocks production until reliability, cost, and upgrade gaps are owned.

## Validation commands

- bash labs/platform-academy/design-production-eks-review/validate.sh
- bash labs/platform-academy/design-production-eks-review/validate.sh --evidence /tmp/production-eks-review-evidence.md
- python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py --review labs/platform-academy/design-production-eks-review/cluster-review.md --launch labs/platform-academy/design-production-eks-review/launch-review.md
- grep -n "Block production launch" labs/platform-academy/design-production-eks-review/launch-review.md

## Validation checks

- [ ] No-AWS architecture review boundary recorded
- [ ] Endpoint and workload-spread evidence captured
- [ ] Missing PDB and zonal storage evidence captured
- [ ] Cost label and cost-review gap evidence captured
- [ ] Upgrade and add-on compatibility evidence captured
- [ ] Launch blockers, follow-ups, and owners recorded
- [ ] Production review analyzer output, validation output, and cleanup/no-AWS evidence recorded

## Rubric

- [ ] Preserves the captured architecture-review safety boundary and avoids live AWS mutation.
- [ ] Captures endpoint posture, missing PDB, critical workload spread, and zonal storage evidence.
- [ ] Captures missing cost label, cost-review gaps, deprecated APIs, and add-on compatibility risk.
- [ ] Separates launch blockers from follow-up improvements with reliability rationale.
- [ ] Assigns workload, platform, data, FinOps, and upgrade owners with validation criteria.
- [ ] Saves launch decision, validation output, cleanup, and no-AWS evidence.

## Cleanup commands

- bash labs/platform-academy/design-production-eks-review/cleanup.sh

## No-cluster fallback

- [ ] Use cluster-review.md as the design review packet.
- [ ] Write launch blockers and follow-up owners without connecting to AWS.
