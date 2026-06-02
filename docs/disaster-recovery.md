# Disaster Recovery

## Local/Demo

PostgreSQL data is stored in the `postgres-data` Docker volume. To reset local state:

```bash
docker compose down -v
docker compose up --build
```

The API reseeds demo data when `AUTO_SEED=true`.

## Production Design

- Use RDS automated backups with point-in-time recovery.
- Enable deletion protection for production databases.
- Store media assets in S3 with versioning and lifecycle policies.
- Keep Terraform state in remote encrypted storage with locking.
- Keep Kubernetes manifests and release history in Git.
- Practice restore drills quarterly.
- Record the deployed Git SHA, API image tag, and `alembic current` output with every database backup.
- Validate restored learner state with `make platform-api-smoke API_BASE=<temporary-api-origin>` before declaring recovery complete.

Recovery targets for a small production version:

- RPO: 15 minutes for database-backed learner progress.
- RTO: 2 hours for regional service restoration.
- Media RPO: near-zero with S3 versioning.

## Restore Drill Outline

1. Provision a temporary database.
2. Run `DATABASE_URL=<temporary-db> alembic upgrade head` from `apps/api` or inside the API image.
3. Restore the latest dump or provider snapshot into the temporary database.
4. Start a temporary API with `CREATE_SCHEMA_ON_STARTUP=false` and the restored `DATABASE_URL`.
5. Run the Platform Academy API smoke test.
6. Compare row counts for `users`, `progress`, `platform_activity`, and `platform_lab_submissions`.
7. Keep the source snapshot until the restored API has passed smoke checks.
