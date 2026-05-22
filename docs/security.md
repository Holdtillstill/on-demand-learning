# Security

Current demo safeguards:

- No real secrets committed.
- `.env.example` contains only local/demo values.
- Mock subscription status avoids payment data.
- API uses request IDs for auditability.
- Kubernetes includes a secret template, service accounts, network policy, resource limits, and non-public dependency notes.
- ECR scan-on-push is enabled in Terraform.
- CI includes dependency review and Trivy filesystem scanning.

Production requirements:

- Use OIDC for user authentication and GitHub Actions cloud access.
- Store secrets in AWS Secrets Manager and project them through External Secrets.
- Enable TLS at ingress and HSTS at the edge.
- Add RBAC, audit logging, image signing, admission policies, and container security contexts.
- Add dependency pinning/renovation and SAST.
- Never process real payments directly; integrate with a compliant payment provider.
