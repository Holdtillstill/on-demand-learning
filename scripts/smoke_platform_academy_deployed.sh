#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python_bin="${PYTHON:-python3}"
API_BASE="${API_BASE:-}"
WEB_BASE="${WEB_BASE:-${API_BASE:-}}"
SMOKE_RUN_ID="${SMOKE_RUN_ID:-$(date -u +%Y%m%d%H%M%S)-$$}"
SMOKE_USER_ID="${USER_ID:-platform-api-smoke-${SMOKE_RUN_ID}}"
SMOKE_INSTALL_BROWSER_DEPS="${SMOKE_INSTALL_BROWSER_DEPS:-true}"
SMOKE_SKIP_BROWSER="${SMOKE_SKIP_BROWSER:-false}"
SMOKE_SKIP_LAB_SMOKE="${SMOKE_SKIP_LAB_SMOKE:-false}"
SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED="${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED:-false}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-false}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-30}"
SMOKE_ARTIFACT_DIR="${SMOKE_ARTIFACT_DIR:-${repo_root}/smoke-artifacts}"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

require_origin() {
  local name="$1"
  local value="$2"
  [ -n "${value}" ] || fail "${name} is required"
  case "${value}" in
    *$'\n'*|*$'\r'*) fail "${name} must not contain newlines" ;;
    http://*|https://*) ;;
    *) fail "${name} must start with http:// or https://" ;;
  esac
}

require_boolean() {
  local name="$1"
  local value="$2"
  case "${value}" in
    true|false) ;;
    *) fail "${name} must be true or false" ;;
  esac
}

require_optional_boolean() {
  local name="$1"
  local value="${!name:-false}"
  require_boolean "${name}" "${value}"
}

require_optional_non_negative_integer() {
  local name="$1"
  local value="${!name:-}"
  [ -z "${value}" ] && return 0
  if [[ ! "${value}" =~ ^[0-9]+$ ]]; then
    fail "${name} must be an integer >= 0"
  fi
}

require_optional_positive_integer() {
  local name="$1"
  local value="${!name:-}"
  [ -z "${value}" ] && return 0
  if [[ ! "${value}" =~ ^[1-9][0-9]*$ ]]; then
    fail "${name} must be an integer >= 1"
  fi
}

require_smoke_user_id() {
  local value="$1"
  case "${value}" in
    *$'\n'*|*$'\r'*) fail "USER_ID must not contain newlines" ;;
  esac
  if [[ ! "${value}" =~ ^[A-Za-z0-9._:-]+$ ]]; then
    fail "USER_ID may only contain letters, numbers, dot, underscore, colon, and hyphen."
  fi
  if [ "${#value}" -gt 71 ]; then
    fail "USER_ID must be 71 characters or fewer because deployed API smoke creates a '-imported' recovery profile."
  fi
}

require_viewports() {
  local value="${SMOKE_VIEWPORTS:-desktop,mobile}"
  local seen=false
  local raw
  local item
  IFS=',' read -ra viewport_items <<<"${value}"
  for raw in "${viewport_items[@]}"; do
    item="${raw#"${raw%%[![:space:]]*}"}"
    item="${item%"${item##*[![:space:]]}"}"
    [ -z "${item}" ] && continue
    seen=true
    if [[ ! "${item}" =~ ^(desktop|mobile|[1-9][0-9]*x[1-9][0-9]*)$ ]]; then
      fail "SMOKE_VIEWPORTS items must be desktop, mobile, or WIDTHxHEIGHT"
    fi
  done
  [ "${seen}" = "true" ] || fail "SMOKE_VIEWPORTS must include at least one viewport"
}

API_BASE="${API_BASE%/}"
WEB_BASE="${WEB_BASE%/}"
require_origin API_BASE "${API_BASE}"
require_origin WEB_BASE "${WEB_BASE}"
require_boolean SMOKE_DRY_RUN "${SMOKE_DRY_RUN}"
require_boolean SMOKE_SKIP_BROWSER "${SMOKE_SKIP_BROWSER}"
require_boolean SMOKE_SKIP_LAB_SMOKE "${SMOKE_SKIP_LAB_SMOKE}"
require_boolean SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}"
require_boolean SMOKE_INSTALL_BROWSER_DEPS "${SMOKE_INSTALL_BROWSER_DEPS}"
require_optional_boolean SMOKE_SKIP_WORKBOOK_FLOW
require_optional_boolean SMOKE_SKIP_ALL_LAB_DETAILS
require_optional_boolean SMOKE_SKIP_ALL_LEARNING_ROUTES
require_optional_boolean SMOKE_SKIP_ALL_RESOURCE_DETAILS
require_optional_boolean SMOKE_SKIP_ALL_INTERVIEW_PACKS
require_optional_boolean SMOKE_DIRECT_ROUTES
require_optional_boolean SMOKE_FAIL_ON_CONSOLE_ERROR
require_optional_boolean SMOKE_WAIT_FOR_NETWORK_IDLE
require_optional_non_negative_integer EXPECTED_COURSES
require_optional_non_negative_integer EXPECTED_LESSONS
require_optional_non_negative_integer EXPECTED_LABS
require_optional_non_negative_integer EXPECTED_PORTFOLIO_LABS
require_optional_non_negative_integer EXPECTED_RESOURCES
require_optional_non_negative_integer EXPECTED_INTERVIEW_PACKS
require_optional_non_negative_integer EXPECTED_INTERVIEW_QUESTIONS
require_optional_non_negative_integer SMOKE_EXPECTED_COURSES
require_optional_non_negative_integer SMOKE_EXPECTED_LESSONS
require_optional_non_negative_integer SMOKE_EXPECTED_LABS
require_optional_non_negative_integer SMOKE_EXPECTED_PORTFOLIO_LABS
require_optional_non_negative_integer SMOKE_EXPECTED_RESOURCES
require_optional_non_negative_integer SMOKE_EXPECTED_INTERVIEW_PACKS
require_optional_non_negative_integer SMOKE_EXPECTED_INTERVIEW_QUESTIONS
require_optional_positive_integer CURL_CONNECT_TIMEOUT
require_optional_positive_integer CURL_MAX_TIME
require_optional_positive_integer SMOKE_TIMEOUT_MS
require_viewports

case "${SMOKE_RUN_ID}" in
  *$'\n'*|*$'\r'*) fail "SMOKE_RUN_ID must not contain newlines" ;;
esac
if [[ ! "${SMOKE_RUN_ID}" =~ ^[A-Za-z0-9._:-]+$ ]]; then
  fail "SMOKE_RUN_ID may only contain letters, numbers, dot, underscore, colon, and hyphen."
fi
require_smoke_user_id "${SMOKE_USER_ID}"
case "${SMOKE_ARTIFACT_DIR}" in
  *$'\n'*|*$'\r'*) fail "SMOKE_ARTIFACT_DIR must not contain newlines" ;;
esac
case "${PLATFORM_SOURCE_BUNDLE_TOKEN:-}" in
  *$'\n'*|*$'\r'*) fail "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines." ;;
esac
if [ "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" = "true" ] && [ -z "${PLATFORM_SOURCE_BUNDLE_TOKEN:-}" ]; then
  fail "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true"
fi

curl_smoke() {
  curl --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -fsS "$@"
}

echo "Running Platform Academy deployed smoke"
echo "API_BASE=${API_BASE}"
echo "WEB_BASE=${WEB_BASE}"
echo "SMOKE_RUN_ID=${SMOKE_RUN_ID}"
echo "Smoke USER_ID=${SMOKE_USER_ID}"
echo "SMOKE_VIEWPORTS=${SMOKE_VIEWPORTS:-desktop,mobile}"
echo "SMOKE_SKIP_LAB_SMOKE=${SMOKE_SKIP_LAB_SMOKE}"
echo "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}"
echo "SMOKE_SKIP_BROWSER=${SMOKE_SKIP_BROWSER}"
echo "SMOKE_INSTALL_BROWSER_DEPS=${SMOKE_INSTALL_BROWSER_DEPS}"

if [ "${SMOKE_DRY_RUN}" = "true" ]; then
  echo "Dry run only; origins and smoke options are valid."
  exit 0
fi

curl_smoke "${API_BASE}/readyz" >/dev/null
PYTHON="${python_bin}" API_BASE="${API_BASE}" SMOKE_RUN_ID="${SMOKE_RUN_ID}" USER_ID="${SMOKE_USER_ID}" \
  PLATFORM_SOURCE_BUNDLE_TOKEN="${PLATFORM_SOURCE_BUNDLE_TOKEN:-}" \
  SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED="${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" \
  "${repo_root}/scripts/smoke_platform_academy_api.sh"

if [ "${SMOKE_SKIP_LAB_SMOKE}" = "true" ]; then
  echo "Skipping lab packet/bundle smoke because SMOKE_SKIP_LAB_SMOKE=true"
else
  PYTHON="${python_bin}" API_BASE="${API_BASE}" SMOKE_RUN_ID="${SMOKE_RUN_ID}" USER_ID="${SMOKE_USER_ID}" \
    PLATFORM_SOURCE_BUNDLE_TOKEN="${PLATFORM_SOURCE_BUNDLE_TOKEN:-}" \
    SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED="${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" \
    "${repo_root}/scripts/smoke_platform_academy_labs.sh"
fi

if [ "${SMOKE_SKIP_BROWSER}" = "true" ]; then
  echo "Skipping browser smoke because SMOKE_SKIP_BROWSER=true"
  exit 0
fi

(
  cd "${repo_root}/apps/platform-academy"
  if [ "${SMOKE_INSTALL_BROWSER_DEPS}" = "true" ]; then
    npm ci
    npx playwright install chromium
  fi
  WEB_BASE="${WEB_BASE}" SMOKE_API_BASE="${API_BASE}" SMOKE_ARTIFACT_DIR="${SMOKE_ARTIFACT_DIR}" npm run smoke:routes
)

echo "Platform Academy deployed smoke passed for ${WEB_BASE}"
