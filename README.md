# Zhongwen Cloud Learning Platform

Zhongwen Cloud Learning Platform is a local-first, production-style portfolio project for learning Mandarin and Chinese art/literature. The product surface is a small Udemy-like learning app; the portfolio story is the platform around it: Docker Compose, FastAPI, React, PostgreSQL, Redis, a worker, metrics, traces, JSON logs, Kubernetes manifests, Terraform AWS scaffolding, CI/CD, SLOs, and runbooks.

## Quickstart

```bash
cp .env.example .env
make bootstrap          # uses python3.11 by default; override with PYTHON=/path/to/python
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

- FastAPI backend with course catalog, lessons, learning path, learner dashboard, XP, streaks, achievements, SRS review queue, character metadata, progress, search, flashcards, quiz attempts, admin seed and nested course-upload endpoints, health/readiness, Prometheus metrics, OpenTelemetry tracing, request IDs, basic rate limiting, and JSON logs.
- React/Vite/TypeScript frontend with learner dashboard, curriculum map, catalog, course detail, lesson viewer, SRS reviews, character practice, progress log, admin authoring upload, and platform information pages.
- Worker service that refreshes recommendations and due-card counts while emitting metrics, logs, and traces.
- PostgreSQL schema created by SQLAlchemy plus seeded Mandarin survival, HSK foundations, character building blocks, Tang poetry, Song painting, calligraphy, classical fiction, and modern culture content.
- Dockerfiles and Docker Compose for app, DB, Redis, Prometheus, Grafana, Jaeger, and optional OpenSearch/Fluent Bit.
- Kubernetes deployment scaffolding with probes, HPAs, PDBs, network policy, ingress, configmaps, and secret template.
- Terraform scaffold for AWS `us-west-2`: VPC, EKS, ECR, S3, RDS, ElastiCache, IAM roles, and Budget alert.
- GitHub Actions for backend, frontend, Docker build, security scan, and manual deploy template.

## Common Commands

```bash
make bootstrap      # Install local Python dependencies with python3.11
make up              # Start local platform
make up-logging      # Start platform plus OpenSearch logging profile
make compose-config  # Validate docker-compose.yml
make backend-test
make worker-test
make frontend-test   # Forces devDependencies even when npm config omit=dev is set
make test
```

## API Examples

```bash
curl http://localhost:8000/api/courses
curl "http://localhost:8000/api/learning-path?user_id=demo-user"
curl http://localhost:8000/api/users/demo-user/dashboard
curl "http://localhost:8000/api/reviews/due?user_id=demo-user"
curl http://localhost:8000/api/characters
curl "http://localhost:8000/api/search?q=Tang"
curl -X POST http://localhost:8000/api/progress \
  -H 'content-type: application/json' \
  -d '{"user_id":"demo-user","lesson_id":1,"completed":true,"score":1}'
curl -X POST http://localhost:8000/api/reviews/1/answer \
  -H 'content-type: application/json' \
  -d '{"user_id":"demo-user","quality":5,"correct":true}'

# Admin/content authoring flow: create a nested course with lessons, vocabulary, and flashcards.
curl -X POST http://localhost:8000/api/admin/courses \
  -H 'content-type: application/json' \
  -d @docs/examples/orchid-pavilion-course.json

# Generate local demo activity for metrics, traces, XP, reviews, and dashboards.
bash scripts/generate_learner_activity.sh
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
