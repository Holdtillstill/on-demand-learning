# Observability

## Metrics

Prometheus scrapes:

- `zhongwen_api_requests_total`
- `zhongwen_api_request_latency_seconds`
- `zhongwen_api_errors_total`
- `zhongwen_api_db_health`
- `zhongwen_quiz_attempts_total`
- `zhongwen_lesson_completions_total`
- `zhongwen_xp_awarded_total`
- `zhongwen_achievements_awarded_total`
- `zhongwen_srs_reviews_total`
- `zhongwen_worker_jobs_total`
- `zhongwen_worker_job_failures_total`
- `zhongwen_worker_recommendations`
- `zhongwen_worker_due_flashcards`

Useful PromQL:

```promql
sum by (path, status_code) (rate(zhongwen_api_requests_total[5m]))
histogram_quantile(0.95, sum by (le, path) (rate(zhongwen_api_request_latency_seconds_bucket[5m])))
sum(rate(zhongwen_api_errors_total[5m]))
increase(zhongwen_worker_job_failures_total[1h])
increase(zhongwen_xp_awarded_total[1h])
increase(zhongwen_srs_reviews_total[1h])
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

Create an index pattern for `zhongwen-logs` in OpenSearch Dashboards.

## Dashboard

Grafana provisions `Zhongwen Platform Overview`, showing API request rate, p95 latency, DB health, learning events, worker jobs, XP awarded, SRS reviews, and worker due-card counts.

## Demo Activity

Run `bash scripts/generate_learner_activity.sh` after Compose is up to create lesson completions, quiz attempts, SRS reviews, dashboard reads, traces, and Prometheus counter movement for an interviewer walkthrough.
