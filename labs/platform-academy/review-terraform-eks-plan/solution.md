# Solution: Review a Terraform EKS Plan

## Decision

Block the plan.

## Evidence

The saved plan shows:

- `module.eks.aws_eks_node_group.apps must be replaced`.
- `subnet_ids` changes from two subnets to only `subnet-bbb222`.
- Desired capacity changes from `6` to `3`, and max capacity from `12` to `6`.
- A security group rule opens `443` to `0.0.0.0/0`.
- IAM policy grants `eks:*` on `*`.
- The plan includes destroy/recreate work: `2 to add, 1 to change, 1 to destroy`.

## Required Remediation

Separate risky changes into smaller plans. Preserve multi-AZ coverage, avoid capacity reduction during replacement, restrict ingress, scope IAM permissions, and require rollback notes before approval.

## Handoff Note

A good handoff says: do not apply this plan because it replaces `module.eks.aws_eks_node_group.apps`, reduces subnet coverage from two subnets to one, cuts desired capacity from 6 to 3, opens `443` to `0.0.0.0/0`, and keeps `eks:*` on `*`. Split the replacement, networking, IAM, and capacity changes into separately reviewed plans with rollback notes.

## Cleanup

No cleanup is required. This lab reviews saved Terraform plan evidence only.
