#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
db_path="${DB_PATH:-/tmp/on-demand-api-migration-check.db}"
python_bin="${PYTHON:-python3}"

rm -f "${db_path}"
export DATABASE_URL="${DATABASE_URL:-sqlite:///${db_path}}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
export OTEL_EXPORTER_OTLP_ENDPOINT="${OTEL_EXPORTER_OTLP_ENDPOINT:-}"

(
  cd "${repo_root}/apps/api"
  "${python_bin}" -m alembic upgrade head
  "${python_bin}" -m alembic current
  "${python_bin}" -m alembic check
)

"${python_bin}" - <<'PY'
import os

from sqlalchemy import create_engine, inspect

database_url = os.environ["DATABASE_URL"]
engine = create_engine(database_url, connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {})
inspector = inspect(engine)
tables = set(inspector.get_table_names())
required = {
    "alembic_version",
    "courses",
    "lessons",
    "users",
    "progress",
    "platform_activity",
    "platform_lab_submissions",
}
missing = sorted(required - tables)
if missing:
    raise SystemExit(f"migration check missing tables: {missing}")

lab_columns = {column["name"] for column in inspector.get_columns("platform_lab_submissions")}
required_lab_columns = {"user_id", "lab_slug", "worksheet_answers", "checked_items", "status", "score", "created_at", "updated_at"}
missing_lab_columns = sorted(required_lab_columns - lab_columns)
if missing_lab_columns:
    raise SystemExit(f"platform_lab_submissions missing columns: {missing_lab_columns}")

print(f"Verified Alembic schema at {database_url}")
PY
