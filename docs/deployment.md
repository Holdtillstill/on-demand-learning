# Deployment Plan

This project is ready for a polished GitHub baseline and local Docker Compose demos. Treat cloud deployment as a staged path: static CDN later for public read-only surfaces, shared EKS preview for full-stack demos, and production API persistence only after database and migration choices are explicit.

For the short handoff version that another deployment session can follow, start with `docs/platform-academy-handoff.md`.

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
- 21 labs
- 17 portfolio-grade labs
- 320 resources
- 219 interview questions

Validation before a release commit:

```bash
make release-check
```

For image, nginx proxy, API, Platform Academy frontend, lab-packet, or lab-bundle changes, run the image gates too:

```bash
make platform-release-check
```

These targets cover Python lint/tests, frontend typecheck/tests/build, Alembic migration drift, changed-file hygiene across tracked and untracked files, shell helper syntax, smoke helper dry-run validation, repo-local Markdown links, sample environment/Compose runtime config, the 21-lab repo contract, Docker Compose config, the Kubernetes Platform Academy runtime contract, Kubernetes manifest validation, GitHub Actions linting, API-image migration execution with startup schema creation disabled, and built API/web container smoke.

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
- `.github/workflows/dependency-audit.yml`
- `.github/workflows/frontend.yml`
- `.github/workflows/docker-build.yml`
- `.github/workflows/platform-academy-image.yml`
- `.github/workflows/platform-deployed-smoke.yml`
- `.github/workflows/platform-validate.yml`
- `.github/workflows/secret-scan.yml`
- `.github/workflows/security.yml`
- `.github/workflows/deploy-template.yml`

`make workflow-lint` validates these workflows with actionlint and `scripts/verify_workflow_contracts.py`. Keep that contract green when deployment work changes image publishing, smoke scripts, or the Platform Academy validation workflow.

The deploy workflow is intentionally a guarded template. Do not turn it into an automatic production deploy until AWS OIDC, image promotion, kubeconfig, environment protection, and rollback procedures are configured. The deployed smoke workflow is safe to enable after `PLATFORM_API_BASE` points at a live preview or stable API; keep the full browser profile for release evidence.

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
- Kubernetes scaffold: replace `ghcr.io/example/zhongwen-api:replace-me`, `ghcr.io/example/platform-academy-web:replace-me`, and example hosts before applying.
- Secrets: injected through Kubernetes Secret or external secret controller
- Database: in-cluster Postgres only for demo data, or a shared low-cost managed database if previews must survive pod reschedules
- Redis: in-cluster for demo
- TLS: cert-manager or managed ingress certificate
- Ingress: shared ALB/nginx gateway depending on the shared cluster standard
- Autoscaling: conservative HPA minimums to reduce cost
- TTL: manually or automatically tear down preview environments when not in use

Preview smoke test:

```bash
curl -f https://preview.academy.ybz.dev/readyz
make platform-api-smoke API_BASE=https://preview.academy.ybz.dev
make platform-browser-smoke WEB_BASE=https://preview.academy.ybz.dev
```

Or run the same deployed API and browser smoke sequence from one command:

```bash
make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
```

The browser smoke runs Chromium against `/dashboard/home`, `/resources`, `/interview-prep`, `/labs`, and `/roadmap` at desktop and mobile viewport sizes, verifies the 17 portfolio-grade lab UI signals and all advertised course, lesson, lab detail, resource detail, and interview-pack routes, and exercises interview cram-sheet downloads, custom study-plan save/download, one workbook save, and guest recovery export/import validation.
For local release checks, `make platform-container-smoke` also builds temporary API and Platform Academy web images, runs them on an isolated Docker network, runs the full API smoke against the built API image, starts the API with production-like source-bundle protection enabled, verifies instructor/source bundles reject unauthenticated requests, download with the smoke token, extract safely, and contain syntax-valid source helpers, then points the browser smoke at the nginx container.
The image publish workflow runs that container smoke against the already-built API and web images before pushing them, including all advertised lab packet and bundle checks, token-gated instructor/source bundle checks, and the smoke gate audits API logs for request failures, tracebacks, and unique-constraint races.

## Stable Public Entry

Use `academy.ybz.dev` for the stable public entry when the app has a persistent deployment target.

Suggested route plan:

- `academy.ybz.dev`: stable public Platform Academy frontend
- `academy.ybz.dev/api/*`: API route if frontend and API share an origin
- `preview.academy.ybz.dev`: on-demand shared-EKS preview
- `learn.example.com` and `academy.example.com` in `infra/k8s/zhongwen-platform.yaml` are placeholders for the Zhongwen and Platform Academy hosts.

CloudFront can sit in front of the frontend later. Do not make Platform Academy pure static S3-only unless the product is intentionally split into a read-only public catalog with no progress/activity persistence.

## Production-Like API Requirements

Confirm these before deploying beyond local demo:

- `API URL`: frontend build/proxy target for the deployed API
- `CORS_ORIGINS`: deployed frontend origins, including preview and stable domains
- `DATABASE_URL`: persistent Postgres connection
- `REDIS_URL`: persistent or in-cluster Redis connection
- `OTEL_EXPORTER_OTLP_ENDPOINT`: collector/Jaeger endpoint, or empty string if disabled
- `ENVIRONMENT`: deployment environment name
- `RATE_LIMIT_PER_MINUTE`: per-client API limit for non-probe paths
- `RATE_LIMIT_EXEMPT_PATHS`: probe/metrics paths that must not consume user request budget
- `TRUSTED_PROXY_CIDRS`: ingress/load-balancer source CIDRs allowed to supply `X-Forwarded-For` or `X-Real-IP`
- `PLATFORM_SOURCE_BUNDLE_PUBLIC`: keep `false` outside local/test/development; API startup rejects `true` in non-local environments so answer-key source bundles cannot be exposed by a single env flip
- `PLATFORM_SOURCE_BUNDLE_TOKEN`: instructor/source bundle token used by smoke or instructor tooling through `X-Platform-Source-Bundle-Token`
- Backup and restore expectation for learner progress

The API refuses startup config that uses wildcard CORS origins, CORS entries with paths or query strings, non-HTTP origins, malformed trusted-proxy CIDRs, `TRUSTED_PROXY_CIDRS` entries that trust every source address, broad rate-limit exemptions such as `/` or `/api`, or `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` outside local/test/development.

Current database caveat:

The app keeps SQLAlchemy `Base.metadata.create_all` enabled by default for local/demo speed, but production-like persistence now has a first-class Alembic path. Set `CREATE_SCHEMA_ON_STARTUP=false` in production-like environments and run migrations before starting or rolling the API when `DATABASE_URL` points at a persistent database:

```bash
cd apps/api
DATABASE_URL=postgresql+psycopg://... alembic upgrade head
```

The API image includes `alembic.ini` and the `alembic/` directory, so the same command can run inside the built container. The Kubernetes scaffold sets `CREATE_SCHEMA_ON_STARTUP=false` and includes a `backend-migrations` Job that runs `alembic upgrade head` with the API image and the same database secret used by the backend Deployment.

For databases that were previously bootstrapped with `Base.metadata.create_all`, inspect the schema and either run the additive SQL reference in `infra/db/migrations/001_platform_progress_tables.sql` for platform progress tables or stamp the database to the matching Alembic revision after confirming all baseline tables already exist.

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
- `make api-migration-check` passes locally, and either `make platform-deployed-smoke API_BASE=<api-origin> WEB_BASE=<web-origin>` passes against the deployed stack or the equivalent separate `platform-api-smoke` and `platform-browser-smoke` commands pass.
- Rate limiting uses the real client IP only when the immediate peer is in `TRUSTED_PROXY_CIDRS`; otherwise forwarded headers are ignored.

Before a preview DNS record is live, dry-run the smoke wiring:

```bash
SMOKE_DRY_RUN=true make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
```

Dry-run mode validates origin syntax, boolean smoke options, and smoke ID safety without touching the remote deployment. Keep custom `SMOKE_RUN_ID` and `USER_ID` values to letters, numbers, dot, underscore, colon, and hyphen so they remain shell-safe and accepted by the public API contract.

For scheduled deployed checks, set the GitHub repository variables `PLATFORM_API_BASE` and, if the web app uses a different origin, `PLATFORM_WEB_BASE`, then enable the `platform-deployed-smoke` workflow. If the deployment protects instructor/source bundles, add the `PLATFORM_SOURCE_BUNDLE_TOKEN` repository secret and set `PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED=true` when scheduled smoke should prove unauthenticated bundle requests are blocked. The workflow also accepts manual `api_base`, `web_base`, `smoke_viewports`, `source_bundle_token_required`, and browser skip inputs for one-off preview validation or non-release triage.

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
- Run `alembic current` against the target database before and after rollback planning.
- Keep database backup/restore notes attached to the release and follow the learner-state restore runbook in `docs/runbooks.md`.
