# Security

Current demo safeguards:

- No real secrets committed.
- `.env.example` contains only local/demo values.
- Mock subscription status avoids payment data.
- API uses request IDs for auditability.
- Kubernetes includes a secret template, service accounts, network policy, resource limits, and non-public dependency notes.
- ECR scan-on-push is enabled in Terraform.
- CI includes dependency review for public pull requests, Gitleaks, Trivy filesystem/secret scanning, Trivy misconfiguration scanning, Docker image scanning, `pip-audit`, and `npm audit`.
- Dependabot tracks GitHub Actions, npm, pip requirements, Dockerfiles, and Terraform.
- Scheduled/static smoke checks cover the static public host, API guardrails, and Platform Academy route behavior.

Production requirements:

- Use OIDC for user authentication and GitHub Actions cloud access.
- Store secrets in AWS Secrets Manager and project them through External Secrets.
- Enable TLS at ingress and HSTS at the edge.
- Add RBAC, audit logging, image signing, admission policies, and container security contexts.
- Add SAST, image signing/provenance verification, and admission policy enforcement for production promotion.
- Never process real payments directly; integrate with a compliant payment provider.
