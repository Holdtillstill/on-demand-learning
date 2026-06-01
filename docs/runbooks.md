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

## Failed Database Migration

Symptoms:
- The `backend-migrations` Job fails or restarts.
- `alembic upgrade head` exits non-zero.
- API pods with `CREATE_SCHEMA_ON_STARTUP=false` fail after a release because tables or columns are missing.

Immediate containment:
1. Stop the rollout before starting more API pods on the new image.
2. Keep the pre-release database snapshot; do not delete or overwrite it.
3. Record the failing migration revision, API image tag, Git SHA, and full migration logs.
4. Run `alembic current` against the target database and compare it with the image's `alembic heads`.

Diagnosis:
1. Confirm the API image contains the expected `alembic.ini` and `alembic/versions`.
2. Confirm `DATABASE_URL` points at the intended database, not a stale preview or local database.
3. If the database was created earlier with `Base.metadata.create_all`, inspect whether baseline tables already exist before running the initial Alembic revision.
4. Run the migration against a restored copy or temporary database before retrying production.

Recovery:
- If no data was changed, fix the migration or config and rerun `alembic upgrade head`.
- If the migration partially applied, prefer a forward repair migration over manual table edits.
- If the application is down and the old image is schema-compatible, roll back the image tag without rolling back schema.
- If data corruption is suspected, restore to a temporary database first and validate with `make platform-api-smoke API_BASE=<temporary-api-origin>`.

Validation:
- `alembic current` reports the expected revision.
- `/readyz` returns `200`.
- `make platform-api-smoke API_BASE=<api-origin>` passes.
- Release notes include the failing revision, recovery action, and final revision.

## Elevated API Error Rate

Symptoms:
- `platform_academy_api_errors_total` increases.
- 5xx status codes appear in request rate panel.

Steps:
1. Open Jaeger and inspect slow/error traces.
2. Filter JSON logs by request ID.
3. Compare error path with recent code or schema changes.
4. If DB-related, verify RDS CPU, connections, locks, and storage.
5. Roll back or disable the failing feature flag if available.

## Unexpected Rate Limiting

Symptoms:
- Users receive `429 rate limit exceeded`.
- Ingress logs show many different users, but API logs appear to group them under one client.

Steps:
1. Confirm `/healthz`, `/readyz`, and `/metrics` are not being counted against learner request budgets.
2. Check whether the API is behind an ingress, load balancer, or reverse proxy.
3. Confirm `TRUSTED_PROXY_CIDRS` contains only the immediate trusted proxy source ranges.
4. Verify the proxy sends `X-Forwarded-For` or `X-Real-IP`.
5. If forwarded headers are absent or the proxy is not trusted, the limiter intentionally falls back to the direct peer IP.
6. If one learner is noisy, keep the limit in place and inspect request IDs before raising the global limit.

Safety note:
- Do not set `TRUSTED_PROXY_CIDRS=0.0.0.0/0` on a public deployment; that lets clients spoof rate-limit identity with headers.

## API Cache Misconfiguration

Symptoms:
- Platform Academy dashboard, lab history, workbook state, or interview/resource activity looks stale after refresh.
- Browser network responses for `/api/platform-academy/*`, `/api/users/*`, `/api/progress/*`, or `/api/reviews/*` are missing `Cache-Control: no-store`.
- A CDN or ingress returns cached API JSON for different guest profiles.

Steps:
1. Check the API directly, bypassing the frontend cache:

```bash
curl -I "$API_BASE/api/platform-academy/catalog"
curl -I "$API_BASE/api/users/<guest-id>/dashboard?domain=platform"
```

2. Confirm dynamic API responses include `Cache-Control: no-store` and `Pragma: no-cache`.
3. Confirm the frontend sends requests with `cache: "no-store"`.
4. Confirm ingress/CDN rules do not cache `/api/*`, `/healthz`, `/readyz`, or `/metrics`.
5. If only static assets are cached, verify they are hashed files under the frontend build and keep their long immutable cache policy.
6. Re-run `make platform-api-smoke API_BASE=<api-origin>` after config changes.

Safety note:
- Never cache guest-specific dashboard, progress, lab submission, activity, or review endpoints at a shared proxy.

## Worker Job Failures

Symptoms:
- `platform_academy_worker_job_failures_total` increases.
- Recommendations stop refreshing.

Steps:
1. Check `docker compose logs worker`.
2. Verify the API has seeded data.
3. Verify Postgres and Redis are reachable.
4. Restart the worker after dependency recovery.

## Platform Learner State Backup And Restore

Scope:
- Database-backed learner state: `users`, `progress`, `review_states`, `platform_activity`, `platform_lab_submissions`, `xp_events`, `user_achievements`, `quiz_attempts`, and `recommendations`.
- Static curriculum, labs, resources, and interview prep live in Git and should be restored by redeploying the matching image/revision.

Preflight before backup:
1. Record the deployed Git SHA, API image tag, and `alembic current` output.
2. Confirm `DATABASE_URL` points at the intended database.
3. Run `make platform-api-smoke API_BASE=<api-origin>` and save the output with the release notes.
4. Confirm whether the backup is a full database backup or a learner-state-only export.

Postgres backup:
1. Prefer an RDS snapshot or provider-native point-in-time backup for production-like data.
2. For an operator-managed dump, convert SQLAlchemy URLs from `postgresql+psycopg://...` to `postgresql://...`.
3. Run a custom-format dump:

```bash
pg_dump --format=custom --file "backups/platform-academy-$(date +%Y%m%d%H%M%S).dump" "$DATABASE_URL"
```

Local Compose backup:

```bash
docker compose exec postgres pg_dump -U platform_academy -d platform_academy --format=custom > backups/local-platform-academy.dump
```

Restore drill:
1. Restore into a temporary database first, never directly over live learner traffic.
2. Apply schema first: `DATABASE_URL=<temporary-db> alembic upgrade head`.
3. Restore the dump into the temporary database with `pg_restore --clean --if-exists --dbname "$DATABASE_URL" <dump-file>`.
4. Point a temporary API instance at the restored database with `CREATE_SCHEMA_ON_STARTUP=false`.
5. Run `make platform-api-smoke API_BASE=<temporary-api-origin>`.
6. Compare basic row counts before approving production restore:

```sql
select count(*) from users;
select count(*) from progress;
select count(*) from platform_activity;
select count(*) from platform_lab_submissions;
```

Production restore notes:
- Freeze writes by pausing public traffic or scaling the API down before restoring into the primary database.
- Keep the pre-restore snapshot until the restored API passes smoke checks and stakeholder review.
- Do not roll back app images across incompatible Alembic revisions without an explicit forward-fix or compatibility note.

## Broken Guest Profile Recovery

Symptoms:
- A learner restores a saved `guest-...` recovery key but sees empty progress.
- New profile generation works, but old progress cannot be found.
- Browser local storage contains a learner ID different from the expected recovery key.

Steps:
1. Confirm the key format is `guest-` plus 12 alphanumeric characters. The frontend rejects other values.
2. Ask the learner for the exact recovery key they copied, not a display name or browser profile name.
3. Query the backend for that profile:

```bash
curl -fsS "$API_BASE/api/users/<guest-id>/dashboard?domain=platform"
curl -fsS "$API_BASE/api/progress/<guest-id>"
curl -fsS "$API_BASE/api/platform-academy/lab-submissions/<guest-id>"
curl -fsS "$API_BASE/api/platform-academy/activity/<guest-id>"
curl -fsS "$API_BASE/api/platform-academy/state/<guest-id>/export"
```

4. If the learner has a JSON profile backup, import it from the recovery dialog while the expected guest profile is active.
5. If backend rows exist, clear only the Platform Academy learner ID in browser storage and restore the key again through the recovery dialog.
6. If backend rows do not exist, check whether the learner used another browser/device, cleared server data, imported the wrong backup, or restored the wrong key.
7. If data existed before a deployment, use the learner-state backup and restore runbook to inspect a temporary restored database.

Validation:
- The dashboard endpoint returns the restored `user_id`.
- `/labs/history` shows saved lab submissions for that key when they exist.
- New activity writes use the restored key in API payloads and logs.

## Elevated API Latency

Symptoms:
- Grafana p95 latency panel exceeds the SLO threshold.
- Jaeger traces show slow `/api/search`, `/api/reviews/due`, or dashboard requests.

Steps:
1. Check whether latency is isolated to one path: `sum by (path) (rate(platform_academy_api_request_latency_seconds_sum[5m]))`.
2. Inspect Jaeger traces for the slow path and verify whether time is in SQL, Redis, or application code.
3. Check Postgres health and query volume: `docker compose ps postgres` and API logs by request ID.
4. If `/api/reviews/due` is slow, verify review-state row counts and worker due-card refresh behavior.
5. Roll back the latest API change if latency correlates with a release and no data dependency is degraded.

## Frontend Works But API Search Fails

Symptoms:
- The React app loads but catalog search or lesson lookup returns an error message.
- Browser network tab shows 4xx/5xx from `/api/search` or `/api/courses`.

Steps:
1. Call the API directly: `curl "http://localhost:8000/api/search?q=Kubernetes"`.
2. Check `/readyz`; if it fails, use the API readiness runbook.
3. Check API logs for request ID, status code, and exception.
4. Verify seed data exists with `curl http://localhost:8000/api/courses`.
5. If only frontend calls fail, confirm `VITE_API_BASE_URL` and nginx proxy config.

## Prometheus Target Down

Symptoms:
- Prometheus target page shows `platform-academy-api` or `platform-academy-worker` down.
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
