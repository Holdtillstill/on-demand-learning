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

Recovery targets for a small production version:

- RPO: 15 minutes for database-backed learner progress.
- RTO: 2 hours for regional service restoration.
- Media RPO: near-zero with S3 versioning.
