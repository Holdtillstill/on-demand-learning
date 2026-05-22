# Cost Controls

This project must not deploy paid resources automatically. Terraform exists as a scaffold and review artifact.

Guardrails:

- AWS Budget resource included with 80% actual and 100% forecasted alerts.
- Small demo instance sizes are used where resources are defined.
- Terraform apply is not part of default CI.
- Deploy workflow requires manual dispatch and an environment approval gate.
- OpenSearch is optional in local Compose because it is memory-heavy.

Before real cloud use:

- Use a sandbox AWS account.
- Set account-level budgets and anomaly detection.
- Prefer managed services with low minimums only when needed.
- Destroy demo environments after review.
- Track EKS, NAT gateway, RDS, OpenSearch, and log retention costs explicitly.
