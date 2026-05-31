# Backlog

## Launch Readiness

- Decide whether to make the GitHub repository public after the demo URL, screenshots, and license posture are final.
- Add branch protection after CI stays green on the protected branch.
- Record a short demo video or GIF for Platform Academy once the preferred local/demo flow is stable.
- Add GitHub issue templates for bug reports, content corrections, and deployment tasks.
- Add a release checklist that ties validation commands to a tagged build.

## Platform Academy Product

- Add first-class Terraform, CI/CD, AWS operations, observability, incident response, FinOps, and career tracks outside interview prep where they need deeper lessons.
- Add learner state export/import so a guest can preserve progress after browser storage is cleared.
- Add optional account-based auth when persistence moves beyond local/demo guest profiles.
- Show source/resource links inline for applicable interview questions.
- Add more guided "answer rubric" examples for senior SRE and platform engineering interviews.
- Add printable interview cram sheets by domain.

## API and Persistence

- Replace local/demo `Base.metadata.create_all` schema creation with reviewed Alembic migrations before true production.
- Define backup and restore procedure for learner progress and PlatformActivity rows.
- Harden CORS, trusted proxy behavior, rate limits, and environment-specific settings before public deployment.
- Add API smoke tests for dashboard, resources, interview prep, activity persistence, and recovery-key flows.

## Deployment

- Choose a production-like persistence model: shared EKS plus in-cluster Postgres for demos, App Runner/ECS plus managed DB for simpler operations, or shared EKS plus RDS for the strongest platform story.
- Build shared-EKS preview TTL automation so previews cannot become permanent monthly spend.
- Add CloudFront in front of the public frontend only after the API origin/routing model is explicit.
- Split a static public marketing/docs/catalog surface later if low-cost static hosting becomes a priority.

## Observability and Operations

- Add a dashboard panel for learner activity saves, guest recovery usage, and interview-prep engagement.
- Add synthetic smoke checks for `/dashboard/home`, `/resources`, `/interview-prep`, `/healthz`, and `/readyz`.
- Add runbook entries for failed migrations, API cache misconfiguration, and broken guest-profile recovery.
