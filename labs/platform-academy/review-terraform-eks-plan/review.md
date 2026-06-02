# Terraform Plan Review

Findings to confirm:

- The app node group is replaced and loses two-AZ subnet coverage.
- Desired and max capacity are cut in half.
- A public ingress rule allows `0.0.0.0/0` to the API security group.
- IAM policy allows `eks:*` on every resource.

Approval decision:

Do not approve until replacement blast radius, subnet coverage, API exposure, IAM scope, rollback, and cost impact are reviewed.
