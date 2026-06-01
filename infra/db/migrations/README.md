# Database Migrations

This directory holds SQL references for production-like deployments that need manual inspection or additive repair.

The primary migration path is now Alembic under `apps/api/alembic`. For a fresh persistent database, run:

```bash
cd apps/api
DATABASE_URL=postgresql+psycopg://... alembic upgrade head
```

The SQL files here are fallback references for databases that were previously bootstrapped with SQLAlchemy `Base.metadata.create_all` and need only additive platform progress tables.

Run migrations only after backing up the target database and confirming the application image contains the matching SQLAlchemy models.
