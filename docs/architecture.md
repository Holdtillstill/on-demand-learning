# Architecture

Platform Academy is a monorepo with three runtime application services:

- `platform-academy`: standalone Cloud Native Platform Academy React/Vite SPA served by Nginx on port `8090`.
- `api`: FastAPI service exposing catalog, lesson, progress, search, flashcard, quiz, health, readiness, and metrics endpoints.
- `worker`: periodic background processor for recommendation refresh and spaced-repetition metadata.

Local dependencies:

- PostgreSQL stores course content, progress, quiz attempts, and recommendations.
- Redis stores lightweight worker outputs such as due-card counts.
- Prometheus scrapes API and worker metrics.
- Grafana provisions a dashboard from code.
- Jaeger receives OpenTelemetry traces.
- OpenSearch/Fluent Bit are available through an optional Compose profile for JSON log exploration.

Request flow:

1. The browser loads Platform Academy on port `8090`.
2. The frontend calls API routes under `/api`.
3. The API reads/writes PostgreSQL and records learning events.
4. The worker periodically reads product data, updates recommendations, and writes due-card counts to Redis.
5. Prometheus, Jaeger, and logs provide the operational view.

Production direction:

- Put the API and worker behind EKS.
- Serve the Platform Academy frontend through CDN/object storage or Kubernetes ingress.
- Use RDS PostgreSQL, ElastiCache Redis, S3 media storage, external secrets, TLS, and managed observability where appropriate.
