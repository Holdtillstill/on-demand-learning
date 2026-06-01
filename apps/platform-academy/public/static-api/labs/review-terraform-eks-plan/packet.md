# Review a Terraform EKS plan

Track: Terraform
Level: Intermediate
Lab tier: full
Estimated time: 50 minutes

## Scenario

A Terraform plan changes node groups, security groups, and IAM roles before a production EKS upgrade.

## Guided run sequence

1. Prepare workspace
   - No Terraform install or AWS credentials required; this lab uses a saved plan excerpt.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup review-terraform-eks-plan
   - bash labs/platform-academy/review-terraform-eks-plan/setup.sh --evidence /tmp/terraform-eks-plan-evidence.md
2. Investigate safely
   - Read triage-notes.md and rule out generated-plan approval shortcuts.
   - Find create, change, replace, and destroy actions.
   - Call out subnet, capacity, security group, and IAM blast radius.
   - Run the local analyzer to produce a block decision from the saved plan.
3. Prove the finding
   - The triage notes rule out saved-plan approval, low-risk replacement assumptions, one-subnet coverage, public HTTPS ingress, and broad EKS IAM.
   - The node group replacement loses multi-AZ subnet coverage.
   - A public 0.0.0.0/0 security group rule is added.
   - An IAM policy grants eks:* on all resources.
4. Reset or hand off
   - bash labs/platform-academy/review-terraform-eks-plan/cleanup.sh
   - Use triage-notes.md and tfplan.txt as the plan artifact.
   - Complete review.md without running terraform.

## Evidence artifact map

- `labs/platform-academy/review-terraform-eks-plan/triage-notes.md` - Decision note
- `labs/platform-academy/review-terraform-eks-plan/tfplan.txt` - Captured evidence
- `labs/platform-academy/review-terraform-eks-plan/review.md` - Decision note
- `labs/platform-academy/review-terraform-eks-plan/decision-record.md` - Decision note
- `labs/platform-academy/review-terraform-eks-plan/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py` - Lab artifact
- `labs/platform-academy/review-terraform-eks-plan/setup.sh` - Lab artifact
- `labs/platform-academy/review-terraform-eks-plan/validate.sh` - Self-check script
- `labs/platform-academy/review-terraform-eks-plan/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/review-terraform-eks-plan/triage-notes.md
- labs/platform-academy/review-terraform-eks-plan/tfplan.txt
- labs/platform-academy/review-terraform-eks-plan/review.md
- labs/platform-academy/review-terraform-eks-plan/decision-record.md
- labs/platform-academy/review-terraform-eks-plan/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py
- labs/platform-academy/review-terraform-eks-plan/setup.sh
- labs/platform-academy/review-terraform-eks-plan/validate.sh
- labs/platform-academy/review-terraform-eks-plan/cleanup.sh

## Worksheet prompts

- [ ] Record the plan artifact, workspace or environment, reviewer, and confirmation that `terraform apply` is not being run.
- [ ] Read triage-notes.md and list the False Leads ruled out before approving or blocking the plan.
- [ ] Paste the node group replacement evidence, subnet coverage before/after, and desired/max capacity change.
- [ ] Paste the public ingress and broad IAM policy evidence.
- [ ] Explain the blast radius, rollback uncertainty, and whether changes should be split into smaller plans.
- [ ] Write the approval decision, required remediation, owner, and follow-up validation.
- [ ] Capture the validation command output and the evidence artifacts you would save for review.

## Prerequisites

- [ ] No Terraform install or AWS credentials required; this lab uses a saved plan excerpt.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup review-terraform-eks-plan
- bash labs/platform-academy/review-terraform-eks-plan/setup.sh --evidence /tmp/terraform-eks-plan-evidence.md
- sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/triage-notes.md
- sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/tfplan.txt

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup review-terraform-eks-plan --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace review-terraform-eks-plan --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip review-terraform-eks-plan-learner-workspace.zip
- cd review-terraform-eks-plan
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read triage-notes.md and rule out generated-plan approval shortcuts.
- [ ] Find create, change, replace, and destroy actions.
- [ ] Call out subnet, capacity, security group, and IAM blast radius.
- [ ] Run the local analyzer to produce a block decision from the saved plan.
- [ ] Write the approval decision and rollback questions.

## Runbook commands

- grep -n "False Leads\|saved plan\|Managed node group\|one-subnet\|eks:\*" labs/platform-academy/review-terraform-eks-plan/triage-notes.md
- grep -n "must be replaced\|0.0.0.0/0\|eks:\*\|Plan:" labs/platform-academy/review-terraform-eks-plan/tfplan.txt
- sed -n '1,160p' labs/platform-academy/review-terraform-eks-plan/review.md

## Expected evidence

- [ ] The triage notes rule out saved-plan approval, low-risk replacement assumptions, one-subnet coverage, public HTTPS ingress, and broad EKS IAM.
- [ ] The node group replacement loses multi-AZ subnet coverage.
- [ ] A public 0.0.0.0/0 security group rule is added.
- [ ] An IAM policy grants eks:* on all resources.
- [ ] The analyzer reports a do-not-approve decision with blocking risk signals.

## Validation commands

- bash labs/platform-academy/review-terraform-eks-plan/validate.sh
- bash labs/platform-academy/review-terraform-eks-plan/validate.sh --evidence /tmp/terraform-eks-plan-evidence.md
- python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt
- grep -n "must be replaced" labs/platform-academy/review-terraform-eks-plan/tfplan.txt
- grep -n "0.0.0.0/0\|eks:\*" labs/platform-academy/review-terraform-eks-plan/tfplan.txt

## Validation checks

- [ ] No-apply safety boundary recorded
- [ ] Triage false leads recorded
- [ ] Replacement and subnet regression evidence captured
- [ ] Capacity reduction evidence captured
- [ ] Public ingress and broad IAM evidence captured
- [ ] Blast radius and rollback decision written
- [ ] Approval/remediation owner recorded
- [ ] Validation output and saved evidence recorded

## Rubric

- [ ] Preserves the no-apply safety boundary and names the reviewed plan artifact.
- [ ] Uses triage notes to rule out saved-plan approval, managed-replacement confidence, one-subnet coverage, public-HTTPS, broad-IAM, and rollback-after-apply False Leads.
- [ ] Captures node group replacement, subnet coverage regression, and capacity reduction evidence.
- [ ] Flags public `0.0.0.0/0` ingress and broad `eks:*` IAM scope.
- [ ] Explains blast radius, rollback uncertainty, owner, and why separate plans are safer.
- [ ] Blocks or conditions approval with concrete remediation and validation requirements.
- [ ] Saves decision, plan, reviewer questions, validation output, and cleanup/no-runtime notes.

## Cleanup commands

- bash labs/platform-academy/review-terraform-eks-plan/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md and tfplan.txt as the plan artifact.
- [ ] Complete review.md without running terraform.
