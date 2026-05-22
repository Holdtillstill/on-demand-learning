# Runbooks

## API Readiness Failing

Symptoms:
- `/readyz` returns `503`.
- Grafana DB health stat is `0`.

Steps:
1. Check API logs for dependency errors: `docker compose logs api`.
2. Check Postgres health: `docker compose ps postgres`.
3. Check Redis health: `docker compose ps redis`.
4. Validate connection strings in `.env` or Compose environment.
5. Restart only the affected dependency if local state is transient.

Production notes:
- Check RDS events, connection saturation, security groups, and recent deployments.
- Roll back the API if readiness began after a release.

## Elevated API Error Rate

Symptoms:
- `zhongwen_api_errors_total` increases.
- 5xx status codes appear in request rate panel.

Steps:
1. Open Jaeger and inspect slow/error traces.
2. Filter JSON logs by request ID.
3. Compare error path with recent code or schema changes.
4. If DB-related, verify RDS CPU, connections, locks, and storage.
5. Roll back or disable the failing feature flag if available.

## Worker Job Failures

Symptoms:
- `zhongwen_worker_job_failures_total` increases.
- Recommendations stop refreshing.

Steps:
1. Check `docker compose logs worker`.
2. Verify the API has seeded data.
3. Verify Postgres and Redis are reachable.
4. Restart the worker after dependency recovery.

## Elevated API Latency

Symptoms:
- Grafana p95 latency panel exceeds the SLO threshold.
- Jaeger traces show slow `/api/search`, `/api/reviews/due`, or dashboard requests.

Steps:
1. Check whether latency is isolated to one path: `sum by (path) (rate(zhongwen_api_request_latency_seconds_sum[5m]))`.
2. Inspect Jaeger traces for the slow path and verify whether time is in SQL, Redis, or application code.
3. Check Postgres health and query volume: `docker compose ps postgres` and API logs by request ID.
4. If `/api/reviews/due` is slow, verify review-state row counts and worker due-card refresh behavior.
5. Roll back the latest API change if latency correlates with a release and no data dependency is degraded.

## Frontend Works But API Search Fails

Symptoms:
- The React app loads but catalog search or lesson lookup returns an error message.
- Browser network tab shows 4xx/5xx from `/api/search` or `/api/courses`.

Steps:
1. Call the API directly: `curl "http://localhost:8000/api/search?q=Tang"`.
2. Check `/readyz`; if it fails, use the API readiness runbook.
3. Check API logs for request ID, status code, and exception.
4. Verify seed data exists with `curl http://localhost:8000/api/courses`.
5. If only frontend calls fail, confirm `VITE_API_BASE_URL` and nginx proxy config.

## Prometheus Target Down

Symptoms:
- Prometheus target page shows `zhongwen-api` or `zhongwen-worker` down.
- Grafana panels have missing data while the app appears usable.

Steps:
1. Inspect targets from inside Compose: `docker compose exec prometheus wget -qO- http://api:8000/metrics`.
2. Check service health: `docker compose ps api worker prometheus`.
3. Verify `observability/prometheus/prometheus.yml` is mounted and includes the expected target.
4. Restart only the missing target after confirming dependency health.
5. Do not rely on a host `localhost:9090` if another process or port-forward owns it; exec into the Prometheus container.

## Course Upload Duplicate Slug

Symptoms:
- Admin upload returns `409 course slug already exists`.
- The UI preview looks valid but submit fails.

Steps:
1. Confirm the slug in the JSON payload.
2. Search existing courses: `curl http://localhost:8000/api/courses | jq '.[].slug'`.
3. Change the slug or intentionally update via a future edit endpoint.
4. If repeated duplicates are unexpected, inspect API logs for multiple browser submissions or retries.

## Incident Example

Incident: lesson completion saves return 500 after a schema change.

Expected response:
- Declare severity based on user impact.
- Freeze deployments.
- Inspect request IDs and traces for failing endpoint.
- Roll back API image or apply a forward database fix.
- Write a short post-incident review with trigger, impact, detection, resolution, and prevention.
