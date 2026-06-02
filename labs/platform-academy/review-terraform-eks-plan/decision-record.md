# Terraform EKS Plan Decision Record

## Decision

Do not approve the plan as written.

## Blocking Risks

- Node group replacement reduces subnet coverage from two subnets to one.
- Desired and maximum capacity are cut in half during a replacement.
- API ingress opens `443` to `0.0.0.0/0`.
- IAM policy grants `eks:*` on all resources.

## Required Changes

- Preserve multi-AZ subnet coverage or provide a migration plan with workload disruption analysis.
- Separate capacity reduction from replacement so rollback is possible.
- Restrict API ingress to approved CIDRs or private access paths.
- Replace `eks:*` with least-privilege actions and scoped resources.
- Add rollback steps and cost impact notes before approval.

## Evidence to Save

Save `tfplan.txt`, this decision record, and the reviewer questions that identify owner, blast radius, rollback, and security impact.

