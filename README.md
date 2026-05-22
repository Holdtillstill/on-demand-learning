# Zhongwen Cloud Learning Platform

Zhongwen Cloud Learning Platform is a local-first, production-style portfolio project for learning Mandarin and Chinese art/literature. The product surface is a small Udemy-like learning app; the portfolio story is the platform around it: Docker Compose, FastAPI, React, PostgreSQL, Redis, a worker, metrics, traces, JSON logs, Kubernetes manifests, Terraform AWS scaffolding, CI/CD, SLOs, and runbooks.

## Quickstart

```bash
cp .env.example .env
docker compose up --build
```

Open:

| Service | URL | Notes |
| --- | --- | --- |
| Frontend | http://localhost:8080 | Course catalog and learner dashboard |
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

- FastAPI backend with course catalog, lessons, progress, search, flashcards, quiz attempts, admin seed endpoint, health/readiness, Prometheus metrics, OpenTelemetry tracing, request IDs, basic rate limiting, and JSON logs.
- React/Vite/TypeScript frontend with catalog, course detail, lesson viewer, flashcards, progress, and platform information pages.
- Worker service that refreshes recommendations and due-card counts while emitting metrics, logs, and traces.
- PostgreSQL schema created by SQLAlchemy plus seeded Mandarin, Tang poetry, Song painting, classical fiction, and modern culture content.
- Dockerfiles and Docker Compose for app, DB, Redis, Prometheus, Grafana, Jaeger, and optional OpenSearch/Fluent Bit.
- Kubernetes deployment scaffolding with probes, HPAs, PDBs, network policy, ingress, configmaps, and secret template.
- Terraform scaffold for AWS `us-west-2`: VPC, EKS, ECR, S3, RDS, ElastiCache, IAM roles, and Budget alert.
- GitHub Actions for backend, frontend, Docker build, security scan, and manual deploy template.

## Common Commands

```bash
make up              # Start local platform
make up-logging      # Start platform plus OpenSearch logging profile
make compose-config  # Validate docker-compose.yml
make backend-test
make worker-test
make frontend-test
make test
```

## API Examples

```bash
curl http://localhost:8000/api/courses
curl "http://localhost:8000/api/search?q=Tang"
curl -X POST http://localhost:8000/api/progress \
  -H 'content-type: application/json' \
  -d '{"user_id":"demo-user","lesson_id":1,"completed":true,"score":1}'
```

## Repository Map

```text
apps/api          FastAPI service
apps/frontend     React/Vite UI
apps/worker       background worker
infra/k8s         Kubernetes manifests
infra/terraform   AWS scaffold, not auto-applied
observability     Prometheus, Grafana, logging config
docs              SRE and platform engineering docs
```

## Known Limitations

- Auth is represented by a mock `demo-user`; production auth would use OIDC or a managed identity provider.
- Subscription/payment status is a mock field, with no real payment integration.
- SQLAlchemy creates schema at startup for local/demo speed; production would use reviewed Alembic migrations.
- The OpenSearch logging profile is intentionally optional because it is heavier than the default local stack.
- Terraform is scaffold-only and should be reviewed before any `apply`.

## Portfolio Narrative

This project demonstrates how to package a real product slice with an operating model: health checks, dependency readiness, SLO thinking, telemetry, CI/CD guardrails, cloud infrastructure planning, Kubernetes deployment design, incident response docs, cost controls, and developer self-service workflows.
