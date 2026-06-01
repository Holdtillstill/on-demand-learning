# Cost Notes

Platform Academy has an API, persistent learner progress, Redis-backed platform behavior, and operational telemetry. The cheapest credible production plan is not pure static hosting unless the app is split into a read-only public surface.

## Recommended Low-Cost Path

1. Keep Docker Compose as the local demo and contributor quickstart.
2. Use shared EKS for short-lived previews and portfolio demos.
3. Add a stable public deployment only after the API and persistence model is chosen.
4. Put CloudFront in front of the public frontend later, but keep API routing explicit.
5. Use budgets and TTL cleanup before creating any always-on cloud resources.

## Costs To Avoid

- A dedicated always-on EKS cluster only for Platform Academy.
- NAT gateways for a low-traffic demo unless the architecture truly requires them.
- Always-on preview namespaces without TTL cleanup.
- Large managed database instances before real usage proves the need.
- Long log retention or high-cardinality metrics for a portfolio demo.

## Likely Hosting Options

- Shared EKS plus in-cluster Postgres: lowest-cost Kubernetes demo, weaker durability.
- App Runner or ECS plus managed Postgres: simpler production operations, less Kubernetes story.
- Shared EKS plus RDS: strongest production-like platform story, higher baseline cost.
- Static CloudFront/S3 only: useful only for a future public marketing/docs/catalog split, not the full learning app.

## Before Any AWS Apply

- Confirm `API URL`, `CORS_ORIGINS`, `DATABASE_URL`, `REDIS_URL`, and `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Add or confirm AWS Budgets and anomaly detection in the target account.
- Confirm rollback, backup, and restore expectations for learner progress.
- Run the Alembic migration check and attach the target revision before treating the database as production data.
- Prefer GitHub OIDC over long-lived AWS access keys.
