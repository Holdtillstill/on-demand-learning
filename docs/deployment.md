# Deployment Plan

This project is ready for a polished GitHub baseline and local Docker Compose demos. Treat cloud deployment as a staged path: static CDN later for public read-only surfaces, shared EKS preview for full-stack demos, and production API persistence only after database and migration choices are explicit.

## Current Local Baseline

Repository path:

```bash
/Users/user/Documents/on-demand-learning
```

Primary product:

- Platform Academy UI: http://127.0.0.1:8090
- API: http://localhost:8000
- Catalog check: http://127.0.0.1:8090/api/platform-academy/catalog

Expected catalog response:

- 21 courses
- 84 lessons
- 21 tracks
- 21 labs
- 320 resources
- 219 interview questions

Validation before a release commit:

```bash
/tmp/on-demand-api-test-venv/bin/python -m pytest apps/api/tests/test_api.py -q
cd apps/platform-academy && npm run typecheck
cd apps/platform-academy && npm test -- --run
cd apps/platform-academy && npm run build
docker compose build
```

Health checks:

```bash
curl -f http://localhost:8000/healthz
curl -f http://localhost:8000/readyz
curl -f http://127.0.0.1:8090/api/platform-academy/catalog
```

## Docker Compose Demo

Use Compose for local portfolio walkthroughs and development validation:

```bash
cp .env.example .env
docker compose up -d --build api platform-academy postgres redis
```

Optional observability services:

```bash
docker compose up -d prometheus grafana jaeger worker
```

Optional heavier logging stack:

```bash
docker compose --profile logging up -d --build
```

Compose is the fastest credible demo mode because it exercises the real API, persistence, progress saves, activity saves, frontend nginx proxy, and no-store academy API cache behavior.

## GitHub Baseline

Before pushing:

- Keep `apps/platform-academy/public/robots.txt`.
- Keep `apps/platform-academy/src/designs.css`.
- Do not commit `.env`, local databases, `dist`, `node_modules`, test reports, screenshots, or Terraform state.
- Confirm no secrets are present in source, docs, Docker files, workflows, or examples.

Expected workflows:

- `.github/workflows/backend.yml`
- `.github/workflows/frontend.yml`
- `.github/workflows/docker-build.yml`
- `.github/workflows/platform-validate.yml`
- `.github/workflows/security.yml`
- `.github/workflows/deploy-template.yml`

The deploy workflow is intentionally a guarded template. Do not turn it into an automatic production deploy until AWS OIDC, image promotion, kubeconfig, environment protection, and rollback procedures are configured.

## Shared EKS Preview

Use shared EKS preview when the app must run full-stack with API persistence and Kubernetes-native operational proof.

Preview goals:

- Exercise frontend, API, Redis, and database connectivity.
- Demonstrate probes, ingress, metrics, logs, and rollout posture.
- Keep cost low by using a shared cluster and short-lived preview environments.
- Avoid an always-on dedicated EKS cluster for this portfolio app.

Recommended preview shape:

- Namespace: `platform-academy-preview`
- Host: `preview.academy.ybz.dev`
- Images: immutable tags from GitHub SHA or release tag
- Secrets: injected through Kubernetes Secret or external secret controller
- Database: in-cluster Postgres only for demo data, or a shared low-cost managed database if previews must survive pod reschedules
- Redis: in-cluster for demo
- TLS: cert-manager or managed ingress certificate
- Ingress: shared ALB/nginx gateway depending on the shared cluster standard
- Autoscaling: conservative HPA minimums to reduce cost
- TTL: manually or automatically tear down preview environments when not in use

Preview smoke test:

```bash
curl -f https://preview.academy.ybz.dev/api/platform-academy/catalog
curl -f https://preview.academy.ybz.dev/readyz
```

Then verify the UI routes listed in the smoke checklist below.

## Stable Public Entry

Use `academy.ybz.dev` for the stable public entry when the app has a persistent deployment target.

Suggested route plan:

- `academy.ybz.dev`: stable public Platform Academy frontend
- `academy.ybz.dev/api/*`: API route if frontend and API share an origin
- `preview.academy.ybz.dev`: on-demand shared-EKS preview

CloudFront can sit in front of the frontend later. Do not make Platform Academy pure static S3-only unless the product is intentionally split into a read-only public catalog with no progress/activity persistence.

## Production-Like API Requirements

Confirm these before deploying beyond local demo:

- `API URL`: frontend build/proxy target for the deployed API
- `CORS_ORIGINS`: deployed frontend origins, including preview and stable domains
- `DATABASE_URL`: persistent Postgres connection
- `REDIS_URL`: persistent or in-cluster Redis connection
- `OTEL_EXPORTER_OTLP_ENDPOINT`: collector/Jaeger endpoint, or empty string if disabled
- `ENVIRONMENT`: deployment environment name
- Rate limit expectations and trusted proxy behavior
- Backup and restore expectation for learner progress

Current database caveat:

The app uses SQLAlchemy `Base.metadata.create_all` for local/demo speed. That is acceptable for this portfolio baseline, but true production should add reviewed Alembic migrations, especially for the `PlatformActivity` table and future schema changes.

## Low-Cost Hosting Options

Recommended order:

1. GitHub + Docker Compose: source credibility and local reproducibility.
2. Shared EKS preview: full-stack demo with Kubernetes proof and controlled cost.
3. Stable production-like deployment after deciding persistence:
   - shared EKS + in-cluster Postgres for demo-only persistence
   - App Runner/ECS + managed database for simpler operations
   - shared EKS + RDS for the most production-like platform story

Avoid always-on dedicated EKS unless there is a specific portfolio or business reason to pay for it.

## Smoke Test Checklist

Run after every deployment or major rebuild:

- `/dashboard/home` renders and shows `21 courses / 84 lessons`.
- `/roadmap` renders 21 roadmap stages.
- `/labs` renders 21 labs and linked lesson buttons.
- `/resources` renders 320 resources and filters without excessive blank space.
- `/interview-prep` renders 22 prep packs and 219 total questions.
- A course page opens from the dashboard course table.
- A lesson page opens from a course page.
- Lesson next/previous navigation works.
- Auto-complete or manual completion writes progress for the current guest profile.
- Resource review, lab run, and interview practice activity state persist for the current guest profile.
- Recovery key modal can restore a saved `guest-...` profile ID.
- API responses include `Cache-Control: no-store` for academy catalog/resources/prep endpoints.
- API `/healthz` and `/readyz` pass.

## Rollback Notes

For local Compose:

```bash
git checkout <known-good-commit>
docker compose up -d --build api platform-academy
```

For shared EKS preview:

- Roll back the image tag to the previous Git SHA.
- Confirm API compatibility with the existing database schema.
- Re-run the smoke test checklist.

For production-like persistence:

- Do not roll back schema casually without a migration plan.
- Keep database backup/restore notes attached to the release.
