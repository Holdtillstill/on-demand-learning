#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
run_id="${RUN_ID:-$RANDOM-$$}"
provided_image="${API_IMAGE:-}"
image="${provided_image:-on-demand-api-release-check:${run_id}}"
skip_build="${API_IMAGE_SKIP_BUILD:-}"
dry_run="${DRY_RUN:-${SMOKE_DRY_RUN:-false}}"
container_db_path="${CONTAINER_DB_PATH:-/tmp/release-check.db}"
remove_image="false"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

if [[ ! "${run_id}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  fail "RUN_ID may only contain letters, numbers, dot, underscore, and hyphen."
fi
case "${dry_run}" in
  true|false) ;;
  *) fail "DRY_RUN/SMOKE_DRY_RUN must be true or false" ;;
esac
case "${CLEAN_IMAGE:-true}" in
  true|false) ;;
  *) fail "CLEAN_IMAGE must be true or false" ;;
esac
case "${container_db_path}" in
  *$'\n'*|*$'\r'*) fail "CONTAINER_DB_PATH must not contain newlines" ;;
  /*) ;;
  *) fail "CONTAINER_DB_PATH must be an absolute path inside the API container" ;;
esac

if [ -z "${skip_build}" ]; then
  if [ -n "${provided_image}" ]; then
    skip_build="true"
  else
    skip_build="false"
    remove_image="true"
  fi
fi
case "${skip_build}" in
  true|false) ;;
  *) fail "API_IMAGE_SKIP_BUILD must be true or false" ;;
esac

cleanup() {
  if [ "${remove_image}" = "true" ] && [ "${CLEAN_IMAGE:-true}" = "true" ]; then
    docker image rm "${image}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if [ "${dry_run}" = "true" ]; then
  echo "API image migration check dry run"
  echo "RUN_ID=${run_id}"
  echo "API_IMAGE=${image}"
  echo "API_IMAGE_SKIP_BUILD=${skip_build}"
  echo "CLEAN_IMAGE=${CLEAN_IMAGE:-true}"
  echo "CONTAINER_DB_PATH=${container_db_path}"
  exit 0
fi

if [ "${skip_build}" = "true" ]; then
  echo "Using existing API image ${image}"
  docker image inspect "${image}" >/dev/null
else
  echo "Building API image ${image}"
  docker build -f "${repo_root}/apps/api/Dockerfile" -t "${image}" "${repo_root}"
fi

docker run --rm \
  -e "DATABASE_URL=sqlite:///${container_db_path}" \
  -e CREATE_SCHEMA_ON_STARTUP=false \
  -e REDIS_URL=redis://localhost:6379/0 \
  -e OTEL_EXPORTER_OTLP_ENDPOINT= \
  "${image}" \
  sh -c 'python -m alembic upgrade head && python -m alembic current && python -m alembic check && test -f /app/labs/platform-academy/verify-full-labs.sh && python - <<'"'"'PY'"'"'
from pathlib import Path

from app.platform_content import LAB_ARTIFACT_PATHS

root = Path("/app")
missing = [
    artifact_path
    for paths in LAB_ARTIFACT_PATHS.values()
    for artifact_path in paths
    if not (root / artifact_path).is_file()
]
if missing:
    raise SystemExit("API image is missing lab source bundle artifacts: " + ", ".join(missing))
print(f"Verified API image includes {sum(len(paths) for paths in LAB_ARTIFACT_PATHS.values())} lab source bundle artifacts.")
PY'

echo "Verified API image migrations and bundled lab verifier in ${image}"
