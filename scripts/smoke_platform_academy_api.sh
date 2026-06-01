#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python_bin="${PYTHON:-python3}"

API_BASE="${API_BASE:-http://localhost:8000}"
API_BASE="${API_BASE%/}"
SMOKE_RUN_ID="${SMOKE_RUN_ID:-$(date -u +%Y%m%d%H%M%S)-$$}"
USER_ID="${USER_ID:-platform-api-smoke-${SMOKE_RUN_ID}}"
EXPECTED_COURSES="${EXPECTED_COURSES:-21}"
EXPECTED_LESSONS="${EXPECTED_LESSONS:-84}"
EXPECTED_LABS="${EXPECTED_LABS:-21}"
EXPECTED_PORTFOLIO_LABS="${EXPECTED_PORTFOLIO_LABS:-12}"
EXPECTED_RESOURCES="${EXPECTED_RESOURCES:-320}"
EXPECTED_INTERVIEW_PACKS="${EXPECTED_INTERVIEW_PACKS:-22}"
EXPECTED_INTERVIEW_QUESTIONS="${EXPECTED_INTERVIEW_QUESTIONS:-219}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-30}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-false}"
PLATFORM_SOURCE_BUNDLE_TOKEN="${PLATFORM_SOURCE_BUNDLE_TOKEN:-}"
SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED="${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED:-false}"

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

require_non_negative_integer() {
  local name="$1"
  local value="$2"
  if [[ ! "${value}" =~ ^[0-9]+$ ]]; then
    fail "${name} must be an integer >= 0"
  fi
}

require_positive_integer() {
  local name="$1"
  local value="$2"
  if [[ ! "${value}" =~ ^[1-9][0-9]*$ ]]; then
    fail "${name} must be an integer >= 1"
  fi
}

require_origin API_BASE "${API_BASE}"
require_boolean SMOKE_DRY_RUN "${SMOKE_DRY_RUN}"
require_boolean SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}"
require_non_negative_integer EXPECTED_COURSES "${EXPECTED_COURSES}"
require_non_negative_integer EXPECTED_LESSONS "${EXPECTED_LESSONS}"
require_non_negative_integer EXPECTED_LABS "${EXPECTED_LABS}"
require_non_negative_integer EXPECTED_PORTFOLIO_LABS "${EXPECTED_PORTFOLIO_LABS}"
require_non_negative_integer EXPECTED_RESOURCES "${EXPECTED_RESOURCES}"
require_non_negative_integer EXPECTED_INTERVIEW_PACKS "${EXPECTED_INTERVIEW_PACKS}"
require_non_negative_integer EXPECTED_INTERVIEW_QUESTIONS "${EXPECTED_INTERVIEW_QUESTIONS}"
require_positive_integer CURL_CONNECT_TIMEOUT "${CURL_CONNECT_TIMEOUT}"
require_positive_integer CURL_MAX_TIME "${CURL_MAX_TIME}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

echo "Smoke testing Platform Academy API at ${API_BASE}"
echo "Smoke USER_ID=${USER_ID}"
echo "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}"

if [[ ! "${USER_ID}" =~ ^[A-Za-z0-9._:-]+$ ]]; then
  fail "USER_ID may only contain letters, numbers, dot, underscore, colon, and hyphen for shell-safe smoke JSON."
fi
if [ "${#USER_ID}" -gt 71 ]; then
  fail "USER_ID must be 71 characters or fewer because API smoke creates a '-imported' recovery profile."
fi
case "${PLATFORM_SOURCE_BUNDLE_TOKEN}" in
  *$'\n'*|*$'\r'*) fail "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines." ;;
esac
if [ "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" = "true" ] && [ -z "${PLATFORM_SOURCE_BUNDLE_TOKEN}" ]; then
  fail "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true"
fi
if [ -n "${PLATFORM_SOURCE_BUNDLE_TOKEN}" ]; then
  echo "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set"
else
  echo "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=unset"
fi

if [ "${SMOKE_DRY_RUN}" = "true" ]; then
  echo "Dry run only; API smoke options are valid."
  exit 0
fi

curl_smoke() {
  curl --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -fsS "$@"
}

fetch_no_store() {
  local path="$1"
  local output="$2"
  local header_file="${tmpdir}/headers-${output##*/}"

  curl_smoke -D "${header_file}" -o "${output}" "${API_BASE}${path}"
  if ! grep -iq '^cache-control:.*no-store' "${header_file}"; then
    echo "Expected Cache-Control: no-store for ${path}" >&2
    cat "${header_file}" >&2
    exit 1
  fi
  if ! grep -iq '^pragma:.*no-cache' "${header_file}"; then
    echo "Expected Pragma: no-cache for ${path}" >&2
    cat "${header_file}" >&2
    exit 1
  fi
}

curl_smoke "${API_BASE}/healthz" >/dev/null
fetch_no_store "/api/platform-academy/catalog" "${tmpdir}/catalog.json"
fetch_no_store "/api/platform-academy/resources" "${tmpdir}/resources.json"
fetch_no_store "/api/platform-academy/interview-prep" "${tmpdir}/interview.json"
curl_smoke "${API_BASE}/api/courses?domain=platform" >"${tmpdir}/platform-courses.json"
curl_smoke "${API_BASE}/openapi.json" >"${tmpdir}/openapi.json"

"${python_bin}" - "${tmpdir}/openapi.json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    spec = json.load(handle)

paths = spec.get("paths", {})
schemas = spec.get("components", {}).get("schemas", {})
required_operations = {
    ("/api/platform-academy/state/{user_id}/export", "get"): "Export Platform Academy learner state",
    ("/api/platform-academy/state/import", "post"): "Import Platform Academy learner state",
    ("/api/platform-academy/labs/{lab_slug}/packet", "get"): "Get Platform Academy Lab Packet",
    ("/api/platform-academy/labs/{lab_slug}/bundle", "get"): "Get Platform Academy Instructor Source Bundle",
    ("/api/platform-academy/labs/{lab_slug}/workspace-bundle", "get"): "Get Platform Academy Learner Workspace Bundle",
    ("/api/platform-academy/labs/{lab_slug}/submission", "post"): "Save a Platform Academy lab workbook",
    ("/api/platform-academy/lab-submissions/{user_id}", "get"): "List Platform Academy lab submissions",
}
for (path, method), summary in required_operations.items():
    operation = paths.get(path, {}).get(method)
    if not operation:
        raise SystemExit(f"OpenAPI missing {method.upper()} {path}")
    if operation.get("summary") != summary:
        raise SystemExit(f"OpenAPI summary changed for {method.upper()} {path}: {operation.get('summary')}")

expected_download_media = {
    "/api/platform-academy/labs/{lab_slug}/packet": "text/markdown",
    "/api/platform-academy/labs/{lab_slug}/bundle": "application/zip",
    "/api/platform-academy/labs/{lab_slug}/workspace-bundle": "application/zip",
}
expected_download_headers = {
    "/api/platform-academy/labs/{lab_slug}/packet": {"Cache-Control", "Pragma", "Content-Disposition"},
    "/api/platform-academy/labs/{lab_slug}/bundle": {"Cache-Control", "Pragma", "Content-Disposition"},
    "/api/platform-academy/labs/{lab_slug}/workspace-bundle": {"Cache-Control", "Pragma", "Content-Disposition"},
}
for path, media_type in expected_download_media.items():
    operation = paths.get(path, {}).get("get", {})
    response = operation.get("responses", {}).get("200", {})
    content = response.get("content", {})
    if media_type not in content:
        raise SystemExit(f"OpenAPI {path} 200 response must advertise {media_type}, got {sorted(content)}")
    if "application/json" in content:
        raise SystemExit(f"OpenAPI {path} download response should not advertise application/json")
    headers = response.get("headers", {})
    missing_headers = sorted(expected_download_headers[path] - set(headers))
    if missing_headers:
        raise SystemExit(f"OpenAPI {path} 200 response missing headers: {missing_headers}")
    if headers.get("Cache-Control", {}).get("schema", {}).get("example") != "no-store":
        raise SystemExit(f"OpenAPI {path} Cache-Control header should document no-store")
    if headers.get("Pragma", {}).get("schema", {}).get("example") != "no-cache":
        raise SystemExit(f"OpenAPI {path} Pragma header should document no-cache")

source_bundle_operation = paths.get("/api/platform-academy/labs/{lab_slug}/bundle", {}).get("get", {})
token_parameter = next(
    (
        parameter
        for parameter in source_bundle_operation.get("parameters", [])
        if parameter.get("name") == "X-Platform-Source-Bundle-Token"
    ),
    None,
)
if not token_parameter or "Instructor/source bundle token" not in token_parameter.get("description", ""):
    raise SystemExit("OpenAPI source-bundle token header parameter should document instructor token behavior")
source_bundle_denial_headers = source_bundle_operation.get("responses", {}).get("403", {}).get("headers", {})
for header_name, expected_example in {"Cache-Control": "no-store", "Pragma": "no-cache"}.items():
    if source_bundle_denial_headers.get(header_name, {}).get("schema", {}).get("example") != expected_example:
        raise SystemExit(f"OpenAPI source-bundle 403 should document {header_name}: {expected_example}")

backup = schemas.get("PlatformLearnerStateExport", {}).get("properties", {})
expected_list_limits = {"progress": 120, "activity": 600, "lab_submissions": 40}
for field, expected_limit in expected_list_limits.items():
    if backup.get(field, {}).get("maxItems") != expected_limit:
        raise SystemExit(f"OpenAPI {field} maxItems expected {expected_limit}, got {backup.get(field)}")

lab_submission = schemas.get("PlatformLabSubmissionIn", {}).get("properties", {})
expected_user_pattern = r"^[A-Za-z0-9._:-]+$"
user_id_schema = lab_submission.get("user_id", {})
if user_id_schema.get("maxLength") != 80 or user_id_schema.get("pattern") != expected_user_pattern:
    raise SystemExit(f"OpenAPI lab submission user_id contract changed: {user_id_schema}")

expected_object_limits = {"worksheet_answers": 80, "checked_items": 160}
for field, expected_limit in expected_object_limits.items():
    if lab_submission.get(field, {}).get("maxProperties") != expected_limit:
        raise SystemExit(f"OpenAPI {field} maxProperties expected {expected_limit}, got {lab_submission.get(field)}")

expected_statuses = ["in_progress", "submitted"]
if lab_submission.get("status", {}).get("enum") != expected_statuses:
    raise SystemExit(f"OpenAPI lab submission status enum changed: {lab_submission.get('status')}")

activity = schemas.get("PlatformActivityIn", {}).get("properties", {})
for field in ["target_type", "target_id", "state"]:
    if activity.get(field, {}).get("pattern") != expected_user_pattern:
        raise SystemExit(f"OpenAPI activity {field} pattern changed: {activity.get(field)}")

print("Validated Platform Academy OpenAPI backup, workbook, and download contract")
PY

"${python_bin}" - \
  "${tmpdir}/catalog.json" \
  "${tmpdir}/resources.json" \
  "${tmpdir}/interview.json" \
  "${tmpdir}/platform-courses.json" \
  "${tmpdir}/first-lesson-id" \
  "${EXPECTED_COURSES}" \
  "${EXPECTED_LESSONS}" \
  "${EXPECTED_LABS}" \
  "${EXPECTED_PORTFOLIO_LABS}" \
  "${EXPECTED_RESOURCES}" \
  "${EXPECTED_INTERVIEW_PACKS}" \
  "${EXPECTED_INTERVIEW_QUESTIONS}" <<'PY'
import json
import sys

catalog_path, resources_path, interview_path, courses_path, lesson_id_path = sys.argv[1:6]
expected_courses, expected_lessons, expected_labs, expected_portfolio_labs, expected_resources, expected_packs, expected_questions = map(int, sys.argv[6:])

with open(catalog_path, encoding="utf-8") as handle:
    catalog = json.load(handle)
with open(resources_path, encoding="utf-8") as handle:
    resources = json.load(handle)
with open(interview_path, encoding="utf-8") as handle:
    interview = json.load(handle)
with open(courses_path, encoding="utf-8") as handle:
    courses = json.load(handle)

if catalog.get("total_courses") != expected_courses:
    raise SystemExit(f"expected {expected_courses} catalog courses, got {catalog.get('total_courses')}")
if catalog.get("total_lessons") != expected_lessons:
    raise SystemExit(f"expected {expected_lessons} catalog lessons, got {catalog.get('total_lessons')}")
if len(catalog.get("labs", [])) != expected_labs:
    raise SystemExit(f"expected {expected_labs} catalog labs, got {len(catalog.get('labs', []))}")
if any(lab.get("lab_tier") != "full" for lab in catalog.get("labs", [])):
    raise SystemExit("expected all catalog labs to be full tier")
expected_portfolio_slugs = {
    "trace-service-to-pod",
    "debug-crashloop-imagepull",
    "review-yaml-before-apply",
    "validate-helm-release-artifact",
    "diagnose-eks-ip-exhaustion",
    "trace-network-path",
    "review-terraform-eks-plan",
    "debug-irsa-access-denied",
    "audit-tenant-boundaries",
    "trace-argocd-drift",
    "design-safe-release-pipeline",
    "write-slo-backed-runbook",
}
portfolio_labs = [lab for lab in catalog.get("labs", []) if lab.get("portfolio_grade") is True]
if len(portfolio_labs) != expected_portfolio_labs:
    raise SystemExit(f"expected {expected_portfolio_labs} portfolio-grade labs, got {len(portfolio_labs)}")
if {lab["slug"] for lab in portfolio_labs} != expected_portfolio_slugs:
    raise SystemExit(f"unexpected portfolio-grade labs: {sorted(lab['slug'] for lab in portfolio_labs)}")
if any(not lab.get("portfolio_focus") for lab in portfolio_labs):
    raise SystemExit("portfolio-grade labs must expose portfolio_focus")

resource_rows = resources.get("resources", [])
if len(resource_rows) != expected_resources:
    raise SystemExit(f"expected {expected_resources} resources, got {len(resource_rows)}")
if not resources.get("domains") or not resources.get("types"):
    raise SystemExit("resources response is missing domain/type facets")
if any(not row.get("source_url", "").startswith("https://") for row in resource_rows):
    raise SystemExit("all resources must expose https source URLs")

packs = interview.get("packs", [])
if len(packs) != expected_packs:
    raise SystemExit(f"expected {expected_packs} interview packs, got {len(packs)}")
if interview.get("total_questions") != expected_questions:
    raise SystemExit(f"expected {expected_questions} interview questions, got {interview.get('total_questions')}")

if len(courses) != expected_courses:
    raise SystemExit(f"expected {expected_courses} platform courses, got {len(courses)}")
first_lesson_id = courses[0]["lessons"][0]["id"]
with open(lesson_id_path, "w", encoding="utf-8") as handle:
    handle.write(str(first_lesson_id))

print("Validated catalog, resources, interview prep, and platform courses")
PY

lesson_id="$(cat "${tmpdir}/first-lesson-id")"
curl_smoke -X POST "${API_BASE}/api/progress" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${lesson_id},\"completed\":true,\"score\":1}" \
  >"${tmpdir}/progress.json"

curl_smoke -X POST "${API_BASE}/api/platform-academy/activity" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"target_type\":\"resource\",\"target_id\":\"kubernetes-debugging-cheatsheet\",\"state\":\"completed\"}" \
  >"${tmpdir}/resource-activity.json"

curl_smoke -X POST "${API_BASE}/api/platform-academy/activity" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"target_type\":\"interview_question\",\"target_id\":\"kubernetes-debugging-interview-pack:1\",\"state\":\"completed\"}" \
  >"${tmpdir}/interview-activity.json"

fetch_no_store "/api/platform-academy/activity/${USER_ID}" "${tmpdir}/activity.json"
fetch_no_store "/api/users/${USER_ID}/dashboard?domain=platform" "${tmpdir}/dashboard.json"

"${python_bin}" - "${tmpdir}/progress.json" "${tmpdir}/activity.json" "${tmpdir}/dashboard.json" "${USER_ID}" <<'PY'
import json
import sys

progress_path, activity_path, dashboard_path, expected_user = sys.argv[1:]
with open(progress_path, encoding="utf-8") as handle:
    progress = json.load(handle)
with open(activity_path, encoding="utf-8") as handle:
    activity = json.load(handle)
with open(dashboard_path, encoding="utf-8") as handle:
    dashboard = json.load(handle)

if progress.get("user_id") != expected_user or not progress.get("completed"):
    raise SystemExit("progress write did not persist for the smoke user")

activity_keys = {(row.get("target_type"), row.get("target_id"), row.get("state")) for row in activity}
required_activity = {
    ("resource", "kubernetes-debugging-cheatsheet", "completed"),
    ("interview_question", "kubernetes-debugging-interview-pack:1", "completed"),
}
missing_activity = sorted(required_activity - activity_keys)
if missing_activity:
    raise SystemExit(f"activity history missing rows: {missing_activity}")

if dashboard.get("user_id") != expected_user:
    raise SystemExit(f"dashboard returned wrong user: {dashboard.get('user_id')}")
if dashboard.get("completed_lessons", 0) < 1:
    raise SystemExit("dashboard did not reflect platform lesson progress")
if dashboard.get("xp", {}).get("lesson_completion_xp", 0) < 20:
    raise SystemExit("dashboard did not reflect lesson completion XP")

print("Validated progress, activity history, and platform dashboard")
PY

PYTHON="${python_bin}" API_BASE="${API_BASE}" SMOKE_RUN_ID="${SMOKE_RUN_ID}" USER_ID="${USER_ID}" EXPECTED_LABS="${EXPECTED_LABS}" \
  PLATFORM_SOURCE_BUNDLE_TOKEN="${PLATFORM_SOURCE_BUNDLE_TOKEN}" \
  SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED="${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" \
  "${repo_root}/scripts/smoke_platform_academy_labs.sh"

fetch_no_store "/api/users/${USER_ID}/dashboard?domain=platform" "${tmpdir}/dashboard-after-labs.json"
"${python_bin}" - "${tmpdir}/dashboard-after-labs.json" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    dashboard = json.load(handle)

earned = {item.get("code") for item in dashboard.get("achievements", []) if item.get("earned")}
expected = {"platform_pathfinder", "resource_curator", "interview_operator", "cluster_debugger"}
missing = sorted(expected - earned)
if missing:
    raise SystemExit(f"missing platform achievements after smoke activity: {missing}")

zhongwen_only = {"poetry_explorer", "character_builder"}
unexpected = sorted(zhongwen_only & {item.get("code") for item in dashboard.get("achievements", [])})
if unexpected:
    raise SystemExit(f"platform dashboard included Zhongwen-only achievements: {unexpected}")

print("Validated Platform Academy achievements")
PY

fetch_no_store "/api/platform-academy/state/${USER_ID}/export" "${tmpdir}/learner-state.json"
"${python_bin}" - "${tmpdir}/learner-state.json" "${tmpdir}/learner-state-import.json" "${USER_ID}-imported" <<'PY'
import json
import sys

state_path, import_body_path, target_user = sys.argv[1:]
with open(state_path, encoding="utf-8") as handle:
    state = json.load(handle)

if state.get("schema_version") != 1:
    raise SystemExit("learner state export missing schema_version=1")
if not state.get("progress") or not state.get("activity") or not state.get("lab_submissions"):
    raise SystemExit("learner state export did not include progress, activity, and lab submission rows")

with open(import_body_path, "w", encoding="utf-8") as handle:
    json.dump({"target_user_id": target_user, "state": state}, handle)
PY

curl_smoke -X POST "${API_BASE}/api/platform-academy/state/import" \
  -H 'content-type: application/json' \
  --data-binary "@${tmpdir}/learner-state-import.json" \
  >"${tmpdir}/learner-state-import-result.json"

"${python_bin}" - "${tmpdir}/learner-state-import-result.json" "${USER_ID}-imported" <<'PY'
import json
import sys

result_path, expected_user = sys.argv[1:]
with open(result_path, encoding="utf-8") as handle:
    result = json.load(handle)

if result.get("user_id") != expected_user:
    raise SystemExit(f"import returned wrong user: {result.get('user_id')}")
for key in ["progress_imported", "activity_imported", "lab_submissions_imported"]:
    if result.get(key, 0) < 1:
        raise SystemExit(f"expected {key} to be at least 1")

print("Validated Platform Academy learner state export/import")
PY

curl_smoke "${API_BASE}/metrics" >"${tmpdir}/metrics.txt"
for metric_name in \
  zhongwen_platform_activity_saves_total \
  zhongwen_platform_dashboard_reads_total \
  zhongwen_platform_lab_packet_downloads_total \
  zhongwen_platform_lab_bundle_downloads_total \
  zhongwen_platform_lab_submissions_total; do
  if ! grep -q "${metric_name}" "${tmpdir}/metrics.txt"; then
    echo "Expected ${metric_name} in /metrics after smoke activity" >&2
    exit 1
  fi
done
echo "Validated Platform Academy product metrics"

echo "Platform Academy API smoke passed for ${API_BASE}"
