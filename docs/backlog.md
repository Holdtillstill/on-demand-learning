# Backlog

## Launch Readiness

- Confirm branch protection, license posture, screenshots, and release notes before public launch.
- Add branch protection after CI stays green on the protected branch.
- Record a short demo video or GIF for Platform Academy once the preferred local/demo flow is stable.

## Platform Academy Product

- Add first-class Terraform, CI/CD, AWS operations, observability, incident response, FinOps, and career tracks outside interview prep where they need deeper lessons.
- Add optional account-based auth when persistence moves beyond local/demo guest profiles.
- Add more guided "answer rubric" examples for senior SRE and platform engineering interviews.
- Promote browser-local custom interview study plans to account-backed persistence once optional auth exists.

## API and Persistence

- Move backend tests from direct `Base.metadata.create_all` fixtures to an Alembic-backed fixture once migration speed and isolation are acceptable.
- Automate periodic backup verification once a persistent deployment target is selected.
- Add environment-specific CORS and trusted-proxy examples once the final preview/stable domains and ingress CIDRs are known.
- Enable the scheduled deployed smoke workflow after `PLATFORM_API_BASE` points at a live preview or stable API.

## Deployment

- Choose a production-like persistence model: shared EKS plus in-cluster Postgres for demos, App Runner/ECS plus managed DB for simpler operations, or shared EKS plus RDS for the strongest platform story.
- Build shared-EKS preview TTL automation so previews cannot become permanent monthly spend.
- Add CloudFront in front of the public frontend only after the API origin/routing model is explicit.
- Split a static public marketing/docs/catalog surface later if low-cost static hosting becomes a priority.
