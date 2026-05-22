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

## Incident Example

Incident: lesson completion saves return 500 after a schema change.

Expected response:
- Declare severity based on user impact.
- Freeze deployments.
- Inspect request IDs and traces for failing endpoint.
- Roll back API image or apply a forward database fix.
- Write a short post-incident review with trigger, impact, detection, resolution, and prevention.
