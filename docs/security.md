# Security

Current demo safeguards:

- No real secrets committed.
- `.env.example` contains only local/demo values.
- Mock subscription status avoids payment data.
- API uses request IDs for auditability.
- Kubernetes includes a secret template, service accounts, network policy, resource limits, and non-public dependency notes.
- ECR scan-on-push is enabled in Terraform.
- CI includes dependency review for public pull requests, Gitleaks, blocking Trivy filesystem vulnerability/secret scanning, Docker image scanning, CodeQL source analysis, `pip-audit`, and `npm audit`. Trivy IaC/Kubernetes misconfiguration scanning is advisory until production promotion because the repo includes lab fixtures and preview scaffolding.
- Dependabot tracks GitHub Actions, npm, pip requirements, Dockerfiles, and Terraform.
- Scheduled/static smoke checks cover the static public host, API guardrails, Platform Academy route behavior, privacy-signal handling, and serious/critical accessibility violations.

Production requirements:

- Use OIDC for user authentication and GitHub Actions cloud access.
- Store secrets in AWS Secrets Manager and project them through External Secrets.
- Enable TLS at ingress and HSTS at the edge.
- Add RBAC, audit logging, image signing, admission policies, and container security contexts.
- Add SAST, image signing/provenance verification, and admission policy enforcement for production promotion.
- Never process real payments directly; integrate with a compliant payment provider.
