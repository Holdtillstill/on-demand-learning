# On-Demand Learning / Platform Academy

[![Backend](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/backend.yml/badge.svg?branch=main)](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/backend.yml)
[![Platform Academy frontend](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/platform-academy-frontend.yml/badge.svg?branch=main)](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/platform-academy-frontend.yml)
[![Docker build](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/docker-build.yml/badge.svg?branch=main)](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/docker-build.yml)
[![Platform validate](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/platform-validate.yml/badge.svg?branch=main)](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/platform-validate.yml)
[![Security](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/Holdtillstill/on-demand-learning/actions/workflows/security.yml)

Platform Academy is a local-first, production-style portfolio project for Kubernetes, EKS, Helm, ArgoCD, security, SRE, and platform engineering. The portfolio story is the full stack around the learning product: Docker Compose, FastAPI, React, PostgreSQL, Redis, a worker, metrics, traces, JSON logs, Kubernetes manifests, Terraform AWS scaffolding, CI/CD, SLOs, and runbooks.

![Platform Academy dashboard](docs/assets/platform-academy-dashboard.png)

## AI-Assisted Development Disclosure

This repository was developed with AI coding assistance. The product direction, architecture decisions, validation, deployment, operations, and maintenance are my responsibility.

## Quickstart

```bash
cp .env.example .env
make bootstrap          # uses python3.11 by default; override with PYTHON=/path/to/python
docker compose up --build
```

Open:

| Service | URL | Notes |
| --- | --- | --- |
| Platform Academy frontend | http://localhost:8090 | Kubernetes/EKS/Helm/ArgoCD/security/SRE learning app |
| API | http://localhost:8000/docs | FastAPI OpenAPI docs |
| API health | http://localhost:8000/healthz | Liveness |
| API readiness | http://localhost:8000/readyz | DB and Redis dependency check |
| API metrics | http://localhost:8000/metrics | Prometheus metrics |
| Prometheus | http://localhost:9090 | Scrapes API and worker |
| Grafana | http://localhost:3001 | `admin` / `admin` |
| Jaeger | http://localhost:16686 | Distributed traces |
| PostgreSQL | localhost:5433 | Host port avoids common local Postgres conflicts |
| Redis | localhost:6380 | Host port avoids common local Redis conflicts |

Optional heavier logging stack:

```bash
docker compose --profile logging up --build
```

Then open OpenSearch Dashboards at http://localhost:5601.

## What Is Built

- FastAPI backend with Platform Academy catalog/roadmap/labs/resources/interview prep, lessons, learning path, learner dashboard, XP, streaks, achievements, SRS review queue, progress, saved Platform Academy activity, search, flashcards, quiz attempts, nested course-upload endpoints, health/readiness, Prometheus metrics, OpenTelemetry tracing, request IDs, basic rate limiting, and JSON logs.
- Platform Academy React/Vite/TypeScript frontend with its own brand, navigation, level filters, roadmap, course pages, lesson pages, labs, resources, interview prep, browser-local guest profiles, and progress/XP display.
- Worker service that refreshes recommendations and due-card counts while emitting metrics, logs, and traces.
- PostgreSQL schema created by SQLAlchemy plus 21 seeded Platform Academy courses with 84 AWS/Kubernetes/SRE/platform engineering lessons.
- Dockerfiles and Docker Compose for app, DB, Redis, Prometheus, Grafana, Jaeger, and optional OpenSearch/Fluent Bit.
- Kubernetes deployment scaffolding with probes, HPAs, PDBs, network policy, ingress, configmaps, and secret template.
- Terraform scaffold for AWS `us-west-2`: VPC, EKS, ECR, S3, RDS, ElastiCache, IAM roles, and Budget alert.
- GitHub Actions for backend, Platform Academy frontend, Docker build, Platform Academy validation/image smoke, scheduled deployed smoke, dependency/security scans, and manual deploy template.

## Common Commands

```bash
make bootstrap      # Install local Python dependencies with python3.11
make up              # Start local platform
make up-logging      # Start platform plus OpenSearch logging profile
make compose-config  # Validate docker-compose.yml
make backend-test
make worker-test
make platform-academy-test
make platform-lab-matrix
make platform-lab-verify
make platform-review-manifest
make k8s-platform-contract
make api-image-migration-check
make platform-api-smoke API_BASE=http://localhost:8000
make platform-browser-smoke WEB_BASE=http://localhost:8090
make platform-container-smoke
make platform-deployed-smoke API_BASE=https://preview.platform-academy.bozhi.dev WEB_BASE=https://preview.platform-academy.bozhi.dev
make test
make workflow-lint
make doc-link-check
make env-contract-check
make working-tree-hygiene-check
make script-syntax-check
make smoke-helper-check
make terraform-validate
make release-check
make platform-release-check
make platform-release-validation
make platform-review-pack
make clean-generated
make clean-smoke-images
```

## API Examples

```bash
curl http://localhost:8000/api/courses
curl "http://localhost:8000/api/learning-path?user_id=demo-user"
curl http://localhost:8000/api/users/demo-user/dashboard
curl "http://localhost:8000/api/reviews/due?user_id=demo-user"
curl "http://localhost:8000/api/search?q=Kubernetes"
curl http://localhost:8000/api/platform-academy/catalog
curl http://localhost:8000/api/platform-academy/roadmap
curl http://localhost:8000/api/platform-academy/labs
curl -X POST http://localhost:8000/api/progress \
  -H 'content-type: application/json' \
  -d '{"user_id":"demo-user","lesson_id":1,"completed":true,"score":1}'
curl -X POST http://localhost:8000/api/reviews/1/answer \
  -H 'content-type: application/json' \
  -d '{"user_id":"demo-user","quality":5,"correct":true}'

# Generate local demo activity for metrics, traces, XP, reviews, and dashboards.
bash scripts/generate_learner_activity.sh
```

## Repository Map

```text
apps/api          FastAPI service
apps/platform-academy Standalone React/Vite Platform Academy UI
apps/worker       background worker
infra/k8s         Kubernetes manifests
infra/terraform   AWS scaffold, not auto-applied
labs/platform-academy Repository-backed Platform Academy lab artifacts and validators
observability     Prometheus, Grafana, logging config
docs              SRE and platform engineering docs
```

## Platform Academy

Open http://localhost:8090 for the Kubernetes/EKS/Helm/ArgoCD/security/SRE learning product. The current seed includes 21 courses, 84 lessons, 21 portfolio-grade labs, 320 resources, and 219 interview questions across Kubernetes, Docker, Terraform, AWS operations, IAM, EKS, CI/CD, observability, incident response, FinOps, platform engineering, and career prep.

See [docs/platform-academy.md](docs/platform-academy.md) for the curriculum outline and local-safe lab story, and [labs/platform-academy/README.md](labs/platform-academy/README.md) for the hands-on lab runner entrypoint.
See [docs/deployment.md](docs/deployment.md) for local, Docker Compose, shared-EKS preview, production API, and smoke-test deployment planning.
See [docs/platform-academy-handoff.md](docs/platform-academy-handoff.md), [docs/release-checklist.md](docs/release-checklist.md), and [docs/smoke-test-checklist.md](docs/smoke-test-checklist.md) for handoff and release verification, [docs/cost-notes.md](docs/cost-notes.md) for the low-cost hosting posture, and [docs/backlog.md](docs/backlog.md) for the next improvement queue.

## Deployment and Cost Notes

- Keep Platform Academy full-stack for progress, activity, learner profile recovery, and API-backed catalog data.
- Use Docker Compose for local demos and a shared EKS preview for Kubernetes runtime validation.
- Use `platform-academy.bozhi.dev` later as the stable public entry and `preview.platform-academy.bozhi.dev` for on-demand shared-EKS previews.
- Do not deploy as pure static S3 unless the public surface is split into a read-only catalog/marketing/docs site.
- Avoid an always-on dedicated EKS cluster; use shared infrastructure, TTL previews, and budgets.
- Run Alembic migrations before production-like persistent API startup.

## Known Limitations

- Auth is represented by a mock `demo-user`; production auth would use OIDC or a managed identity provider.
- Subscription/payment status is a mock field, with no real payment integration.
- SQLAlchemy creates schema at startup for local/demo speed; production-like deployments should run Alembic separately with `CREATE_SCHEMA_ON_STARTUP=false`.
- Platform Academy anonymous progress uses browser-local guest IDs plus backend rows; clearing local storage creates a new guest profile unless the learner saved the recovery key.
- The OpenSearch logging profile is intentionally optional because it is heavier than the default local stack.
- Terraform is scaffold-only and should be reviewed before any `apply`.
- Platform Academy EKS material is instructional and local-first; it does not deploy to AWS or require credentials.

## Portfolio Narrative

This project demonstrates how to package a real product slice with an operating model: health checks, dependency readiness, SLO thinking, telemetry, CI/CD guardrails, cloud infrastructure planning, Kubernetes deployment design, incident response docs, cost controls, and developer self-service workflows.

## License

MIT. See [LICENSE](LICENSE).
