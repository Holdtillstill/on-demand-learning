# Observability

## Metrics

Prometheus scrapes:

- `platform_academy_api_requests_total`
- `platform_academy_api_request_latency_seconds`
- `platform_academy_api_errors_total`
- `platform_academy_api_db_health`
- `platform_academy_quiz_attempts_total`
- `platform_academy_lesson_completions_total`
- `platform_academy_xp_awarded_total`
- `platform_academy_achievements_awarded_total`
- `platform_academy_srs_reviews_total`
- `platform_academy_activity_saves_total`
- `platform_academy_lab_submissions_total`
- `platform_academy_lab_packet_downloads_total`
- `platform_academy_lab_bundle_downloads_total`
- `platform_academy_dashboard_reads_total`
- `platform_academy_worker_jobs_total`
- `platform_academy_worker_job_failures_total`
- `platform_academy_worker_recommendations`
- `platform_academy_worker_due_flashcards`

Useful PromQL:

```promql
sum by (path, status_code) (rate(platform_academy_api_requests_total[5m]))
histogram_quantile(0.95, sum by (le, path) (rate(platform_academy_api_request_latency_seconds_bucket[5m])))
sum(rate(platform_academy_api_errors_total[5m]))
increase(platform_academy_worker_job_failures_total[1h])
increase(platform_academy_xp_awarded_total[1h])
increase(platform_academy_srs_reviews_total[1h])
sum by (target_type, state) (increase(platform_academy_activity_saves_total[1h]))
sum by (status) (increase(platform_academy_lab_submissions_total[1h]))
sum(increase(platform_academy_lab_packet_downloads_total[1h]))
sum(increase(platform_academy_lab_bundle_downloads_total[1h]))
sum by (domain) (increase(platform_academy_dashboard_reads_total[1h]))
```

## Alerts

Prometheus loads `observability/prometheus/alerts.yml` in local Compose. The rules cover:

- API high 5xx rate.
- API readiness dependency failure.
- API p95 latency above 1 second.
- Worker scrape target down.
- Worker job failures.

## Tracing

The API uses OpenTelemetry FastAPI and SQLAlchemy instrumentation. The worker creates spans for periodic jobs. In local Compose, traces export through OTLP HTTP to Jaeger at http://localhost:16686.

## Logs

Services emit JSON logs to stdout. API logs include request ID, method, path, status code, and duration. The optional logging profile starts OpenSearch, OpenSearch Dashboards, and Fluent Bit.

Run:

```bash
docker compose --profile logging up --build
```

Create an index pattern for `platform-academy-logs` in OpenSearch Dashboards.

## Dashboard

Grafana provisions `Platform Academy Overview`, showing API request rate, p95 latency, DB health, learning events, worker jobs, XP awarded, SRS reviews, worker due-card counts, Platform Academy activity saves, lab submissions, lab packet and bundle downloads, and dashboard reads.

## Demo Activity

Run `bash scripts/generate_learner_activity.sh` after Compose is up to create lesson completions, quiz attempts, SRS reviews, Platform Academy activity saves, guest recovery activity, lab submissions, lab packet and bundle downloads, dashboard reads, traces, and Prometheus counter movement for an interviewer walkthrough.
