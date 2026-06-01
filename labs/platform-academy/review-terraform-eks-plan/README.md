# Full Lab: Review a Terraform EKS Plan

## Goal

Review a Terraform plan before it changes an EKS platform. The lab focuses on blast radius, capacity, network exposure, IAM scope, and rollback.

## Time

40 to 60 minutes.

## Safety

This lab uses a saved plan excerpt. Do not run `terraform apply`.

## Starting State

```bash
bash labs/platform-academy/review-terraform-eks-plan/setup.sh --evidence /tmp/terraform-eks-plan-evidence.md
sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/triage-notes.md
sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/tfplan.txt
sed -n '1,180p' labs/platform-academy/review-terraform-eks-plan/review.md
```

Setup stages the evidence note and plan-review paths. It does not run the analyzer by default, so you can make the approve/block decision before checking the local risk summary.

Run the local plan risk analyzer:

```bash
python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py \
  --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt
```

You can also ask setup to run the same check after staging evidence:

```bash
bash labs/platform-academy/review-terraform-eks-plan/setup.sh --run-analyzer --evidence /tmp/terraform-eks-plan-evidence.md
```

## Investigation

Find:

- The triage False Leads that would approve a generated plan without blast-radius review.
- Which resource is replaced.
- Whether subnet or Availability Zone coverage changes.
- Whether capacity changes during replacement.
- Any public ingress.
- Any broad IAM permissions.
- Whether rollback is obvious after apply.
- Whether the analyzer finds enough blocking risk signals to reject the plan.

## Decision Target

```bash
sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/decision-record.md
```

## Validation

```bash
bash labs/platform-academy/review-terraform-eks-plan/validate.sh
bash labs/platform-academy/review-terraform-eks-plan/validate.sh --evidence /tmp/terraform-eks-plan-evidence.md
```

## Success Criteria

- You rule out the triage false leads before approving or blocking the plan.
- You block the plan before mutation.
- You name the replacement blast radius.
- You connect network and IAM findings to platform risk.
- You produce a decision record with required changes.
- You use the analyzer output as evidence for the block decision.
- Your evidence note names replacement, subnet coverage, capacity, ingress, IAM, rollback, decision, owner, and validation evidence.
