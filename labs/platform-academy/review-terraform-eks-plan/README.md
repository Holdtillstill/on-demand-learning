# Full Lab: Review a Terraform EKS Plan

## Goal

Review a Terraform plan before it changes an EKS platform. The lab focuses on blast radius, capacity, network exposure, IAM scope, and rollback.

## Time

40 to 60 minutes.

## Safety

This lab uses a saved plan excerpt. Do not run `terraform apply`.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/tfplan.txt
sed -n '1,180p' labs/platform-academy/review-terraform-eks-plan/review.md
cp labs/platform-academy/review-terraform-eks-plan/evidence-template.md /tmp/terraform-plan-evidence.md
```

## Investigation

Find:

- Which resource is replaced.
- Whether subnet or Availability Zone coverage changes.
- Whether capacity changes during replacement.
- Any public ingress.
- Any broad IAM permissions.
- Whether rollback is obvious after apply.

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

- You block the plan before mutation.
- You name the replacement blast radius.
- You connect network and IAM findings to platform risk.
- You produce a decision record with required changes.
- Your evidence note names replacement, subnet coverage, capacity, ingress, IAM, rollback, decision, owner, and validation evidence.
