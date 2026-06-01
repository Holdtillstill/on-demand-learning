#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
run_id="${RUN_ID:-$RANDOM-$$}"
api_image="${API_IMAGE:-on-demand-platform-smoke-api:${run_id}}"
web_image="${WEB_IMAGE:-on-demand-platform-smoke-web:${run_id}}"
network_name="${NETWORK_NAME:-on-demand-platform-smoke-${run_id}}"
api_container="${API_CONTAINER:-on-demand-platform-smoke-api-${run_id}}"
web_container="${WEB_CONTAINER:-on-demand-platform-smoke-web-${run_id}}"
artifact_dir="${SMOKE_ARTIFACT_DIR:-${repo_root}/smoke-artifacts}"
skip_build="${SMOKE_SKIP_BUILD:-false}"
skip_lab_smoke="${SMOKE_SKIP_LAB_SMOKE:-false}"
source_bundle_token="${PLATFORM_SOURCE_BUNDLE_TOKEN:-platform-container-source-token-${run_id}}"
dry_run="${SMOKE_DRY_RUN:-false}"
curl_connect_timeout="${CURL_CONNECT_TIMEOUT:-5}"
curl_wait_max_time="${CURL_WAIT_MAX_TIME:-5}"
curl_max_time="${CURL_MAX_TIME:-30}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

require_boolean() {
  local name="$1"
  local value="$2"
  case "${value}" in
    true|false) ;;
    *) fail "${name} must be true or false" ;;
  esac
}

require_positive_integer() {
  local name="$1"
  local value="$2"
  if [[ ! "${value}" =~ ^[1-9][0-9]*$ ]]; then
    fail "${name} must be an integer >= 1"
  fi
}

if [[ ! "${run_id}" =~ ^[A-Za-z0-9_.-]+$ ]]; then
  fail "RUN_ID may only contain letters, numbers, dot, underscore, and hyphen."
fi

require_boolean SMOKE_DRY_RUN "${dry_run}"
require_boolean SMOKE_SKIP_BUILD "${skip_build}"
require_boolean SMOKE_SKIP_LAB_SMOKE "${skip_lab_smoke}"
require_positive_integer CURL_CONNECT_TIMEOUT "${curl_connect_timeout}"
require_positive_integer CURL_WAIT_MAX_TIME "${curl_wait_max_time}"
require_positive_integer CURL_MAX_TIME "${curl_max_time}"
case "${source_bundle_token}" in
  *$'\n'*|*$'\r'*) fail "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines." ;;
esac

curl_wait() {
  curl --connect-timeout "${curl_connect_timeout}" --max-time "${curl_wait_max_time}" -fsS "$@"
}

curl_smoke() {
  curl --connect-timeout "${curl_connect_timeout}" --max-time "${curl_max_time}" -fsS "$@"
}

cleanup() {
  local status=$?
  if [ "${status}" -ne 0 ]; then
    mkdir -p "${artifact_dir}"
    docker logs "${api_container}" >"${artifact_dir}/platform-academy-api-container.log" 2>&1 || true
    docker logs "${web_container}" >"${artifact_dir}/platform-academy-web-container.log" 2>&1 || true
  fi
  docker rm -f "${web_container}" "${api_container}" >/dev/null 2>&1 || true
  docker network rm "${network_name}" >/dev/null 2>&1 || true
}

if [ "${dry_run}" = "true" ]; then
  echo "Platform Academy container smoke dry run"
  echo "RUN_ID=${run_id}"
  echo "API_IMAGE=${api_image}"
  echo "WEB_IMAGE=${web_image}"
  echo "NETWORK_NAME=${network_name}"
  echo "API_CONTAINER=${api_container}"
  echo "WEB_CONTAINER=${web_container}"
  echo "SMOKE_SKIP_BUILD=${skip_build}"
  echo "SMOKE_SKIP_LAB_SMOKE=${skip_lab_smoke}"
  echo "API_ENVIRONMENT=preview"
  echo "PLATFORM_SOURCE_BUNDLE_PUBLIC=false"
  echo "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set"
  echo "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true"
  echo "LAB_SMOKE_USER_ID=platform-container-lab-smoke-${run_id}"
  exit 0
fi

trap cleanup EXIT

if [ "${skip_build}" = "true" ]; then
  echo "Using existing Platform Academy smoke images"
  docker image inspect "${api_image}" >/dev/null
  docker image inspect "${web_image}" >/dev/null
else
  echo "Building Platform Academy smoke images"
  docker build -f "${repo_root}/apps/api/Dockerfile" -t "${api_image}" "${repo_root}"
  docker build -f "${repo_root}/apps/platform-academy/Dockerfile" -t "${web_image}" "${repo_root}"
fi

docker network create "${network_name}" >/dev/null

docker run -d \
  --name "${api_container}" \
  --network "${network_name}" \
  --network-alias api \
  -p 127.0.0.1::8000 \
  -e ENVIRONMENT=preview \
  -e DATABASE_URL=sqlite:////tmp/platform-container-smoke.db \
  -e CREATE_SCHEMA_ON_STARTUP=true \
  -e AUTO_SEED=true \
  -e REDIS_URL=redis://redis:6379/0 \
  -e RATE_LIMIT_PER_MINUTE=1000 \
  -e PLATFORM_SOURCE_BUNDLE_PUBLIC=false \
  -e PLATFORM_SOURCE_BUNDLE_TOKEN="${source_bundle_token}" \
  -e OTEL_EXPORTER_OTLP_ENDPOINT= \
  "${api_image}" >/dev/null

api_port="$(docker port "${api_container}" 8000/tcp | awk -F: 'NR == 1 {print $NF}')"
api_base="http://127.0.0.1:${api_port}"

echo "Waiting for API container health at ${api_base}"
for _ in {1..45}; do
  if curl_wait "${api_base}/healthz" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl_smoke "${api_base}/healthz" >/dev/null

PYTHON="${PYTHON:-python3}" API_BASE="${api_base}" USER_ID="platform-container-api-smoke-${run_id}" \
  PLATFORM_SOURCE_BUNDLE_TOKEN="${source_bundle_token}" SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true \
  "${repo_root}/scripts/smoke_platform_academy_api.sh"

if [ "${skip_lab_smoke}" = "true" ]; then
  echo "Skipping lab packet/bundle smoke because SMOKE_SKIP_LAB_SMOKE=true"
else
  PYTHON="${PYTHON:-python3}" API_BASE="${api_base}" USER_ID="platform-container-lab-smoke-${run_id}" \
    PLATFORM_SOURCE_BUNDLE_TOKEN="${source_bundle_token}" SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true \
    "${repo_root}/scripts/smoke_platform_academy_labs.sh"
fi

docker run -d \
  --name "${web_container}" \
  --network "${network_name}" \
  -e PLATFORM_API_UPSTREAM=http://api:8000 \
  -p 127.0.0.1::80 \
  "${web_image}" >/dev/null

web_port="$(docker port "${web_container}" 80/tcp | awk -F: 'NR == 1 {print $NF}')"
web_base="http://127.0.0.1:${web_port}"

echo "Waiting for Platform Academy web container at ${web_base}"
for _ in {1..45}; do
  if curl_wait "${web_base}/dashboard/home" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl_smoke "${web_base}/dashboard/home" >/dev/null

(
  cd "${repo_root}/apps/platform-academy"
  WEB_BASE="${web_base}" SMOKE_API_BASE="${api_base}" SMOKE_ARTIFACT_DIR="${artifact_dir}" npm run smoke:routes
)

api_log="$(mktemp)"
docker logs "${api_container}" >"${api_log}" 2>&1
if ! "${repo_root}/scripts/audit_api_log.sh" "${api_log}" "Platform Academy container smoke"; then
  mkdir -p "${artifact_dir}"
  cp "${api_log}" "${artifact_dir}/platform-academy-api-container.log"
  echo "Saved API container log to ${artifact_dir}/platform-academy-api-container.log" >&2
  exit 1
fi
rm -f "${api_log}"

echo "Platform Academy container smoke passed for ${web_base}"
