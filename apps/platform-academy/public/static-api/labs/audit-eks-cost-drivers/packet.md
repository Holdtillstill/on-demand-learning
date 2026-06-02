# Audit EKS cost drivers

Track: FinOps
Level: Advanced
Lab tier: full
Estimated time: 60 minutes

## Scenario

Cloud spend jumped after a platform migration, and you need to separate real growth from Kubernetes and AWS waste.

## Guided run sequence

1. Prepare workspace
   - No AWS Cost Explorer access required; this lab uses local cost evidence files.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup audit-eks-cost-drivers
   - bash labs/platform-academy/audit-eks-cost-drivers/setup.sh --evidence /tmp/eks-cost-evidence.md
2. Investigate safely
   - Read the triage notes and rule out unsafe delete-first cost actions.
   - Rank compute over-requesting, idle load balancers, and abandoned storage.
   - Use the local analyzer to separate quick-win monthly exposure from architecture-review items.
   - Map each finding to an owner, savings estimate, reliability risk, and rollback.
3. Prove the finding
   - The triage notes rule out utilization-only deletion, unknown-owner deletion, age-only cleanup, and savings without rollback.
   - Checkout and worker CPU requests are far above usage.
   - Default namespace has abandoned load balancer and storage entries.
   - Some resources have unknown owner metadata.
4. Reset or hand off
   - bash labs/platform-academy/audit-eks-cost-drivers/cleanup.sh
   - Use triage-notes.md plus the CSV and text snapshots as cost evidence.
   - Write a cost recommendation table without live AWS access.

## Evidence artifact map

- `labs/platform-academy/audit-eks-cost-drivers/triage-notes.md` - Decision note
- `labs/platform-academy/audit-eks-cost-drivers/usage.csv` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/services.txt` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/storage.txt` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/recommendations.md` - Decision note
- `labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/setup.sh` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/audit-eks-cost-drivers/validate.sh` - Self-check script
- `labs/platform-academy/audit-eks-cost-drivers/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/audit-eks-cost-drivers/triage-notes.md
- labs/platform-academy/audit-eks-cost-drivers/usage.csv
- labs/platform-academy/audit-eks-cost-drivers/services.txt
- labs/platform-academy/audit-eks-cost-drivers/storage.txt
- labs/platform-academy/audit-eks-cost-drivers/recommendations.md
- labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py
- labs/platform-academy/audit-eks-cost-drivers/setup.sh
- labs/platform-academy/audit-eks-cost-drivers/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/audit-eks-cost-drivers/validate.sh
- labs/platform-academy/audit-eks-cost-drivers/cleanup.sh

## Worksheet prompts

- [ ] Record the usage, service, storage, and recommendation files plus confirmation that no AWS or cluster deletion is being made.
- [ ] Read triage-notes.md and list the False Leads ruled out before recommending cost changes.
- [ ] Paste over-requested workload rows, unknown-owner rows, and request-versus-usage evidence.
- [ ] Paste abandoned LoadBalancer, abandoned PVC, estimated monthly cost, and architecture-review evidence.
- [ ] Rank quick wins versus architecture changes with reliability risk and ownership confidence.
- [ ] Write recommendations with owner, expected savings, rollback, and review cadence.
- [ ] Capture recommendations table, validation output, cleanup, and no-AWS evidence note.

## Prerequisites

- [ ] No AWS Cost Explorer access required; this lab uses local cost evidence files.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup audit-eks-cost-drivers
- bash labs/platform-academy/audit-eks-cost-drivers/setup.sh --evidence /tmp/eks-cost-evidence.md
- sed -n '1,220p' labs/platform-academy/audit-eks-cost-drivers/triage-notes.md
- sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/usage.csv
- sed -n '1,120p' labs/platform-academy/audit-eks-cost-drivers/services.txt

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup audit-eks-cost-drivers --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace audit-eks-cost-drivers --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip audit-eks-cost-drivers-learner-workspace.zip
- cd audit-eks-cost-drivers
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read the triage notes and rule out unsafe delete-first cost actions.
- [ ] Rank compute over-requesting, idle load balancers, and abandoned storage.
- [ ] Use the local analyzer to separate quick-win monthly exposure from architecture-review items.
- [ ] Map each finding to an owner, savings estimate, reliability risk, and rollback.
- [ ] Decide which recommendations are quick wins versus architecture changes.

## Runbook commands

- grep -n "False Leads\|Low utilization\|Unknown owner\|LoadBalancer age" labs/platform-academy/audit-eks-cost-drivers/triage-notes.md
- awk -F, 'NR==1 || $8=="unknown" || $3 > ($4 * 4) {print}' labs/platform-academy/audit-eks-cost-drivers/usage.csv
- grep -n "abandoned\|LoadBalancer\|unknown" labs/platform-academy/audit-eks-cost-drivers/services.txt labs/platform-academy/audit-eks-cost-drivers/storage.txt

## Expected evidence

- [ ] The triage notes rule out utilization-only deletion, unknown-owner deletion, age-only cleanup, and savings without rollback.
- [ ] Checkout and worker CPU requests are far above usage.
- [ ] Default namespace has abandoned load balancer and storage entries.
- [ ] Some resources have unknown owner metadata.
- [ ] The local analyzer reports EKS cost driver analysis passed and quick-win monthly exposure.
- [ ] The recommendation table includes savings, reliability risk, and rollback.

## Validation commands

- bash labs/platform-academy/audit-eks-cost-drivers/validate.sh
- bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence /tmp/eks-cost-evidence.md
- python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py --usage labs/platform-academy/audit-eks-cost-drivers/usage.csv --services labs/platform-academy/audit-eks-cost-drivers/services.txt --storage labs/platform-academy/audit-eks-cost-drivers/storage.txt --recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md
- grep -n "Expected Savings" labs/platform-academy/audit-eks-cost-drivers/recommendations.md

## Validation checks

- [ ] No-delete/no-AWS safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] EKS cost driver analysis passed output captured
- [ ] Compute over-request evidence captured
- [ ] Unknown owner evidence captured
- [ ] Abandoned LoadBalancer and PVC evidence captured
- [ ] Quick-win monthly exposure and architecture-review items separated
- [ ] Owner, savings, risk, rollback, and cadence recorded
- [ ] Validation output and cleanup/no-AWS evidence recorded

## Rubric

- [ ] Preserves the no-delete/no-AWS safety boundary and names the local cost evidence files.
- [ ] Uses triage notes to rule out utilization-only deletion, unknown-owner deletion, age-only cleanup, and savings-without-rollback False Leads.
- [ ] Captures over-requested workloads, unknown owners, and usage/request ratio evidence.
- [ ] Captures abandoned LoadBalancer, abandoned PVC, expected cost, and architecture-review items.
- [ ] Separates quick wins from architecture changes and avoids deletion without owner confirmation.
- [ ] Assigns owner, expected savings, reliability risk, rollback, and review cadence.
- [ ] Saves recommendations, validation output, cleanup, and no-AWS evidence.

## Cleanup commands

- bash labs/platform-academy/audit-eks-cost-drivers/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md plus the CSV and text snapshots as cost evidence.
- [ ] Write a cost recommendation table without live AWS access.
