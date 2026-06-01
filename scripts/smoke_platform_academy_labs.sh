#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
API_BASE="${API_BASE%/}"
python_bin="${PYTHON:-python3}"
SMOKE_RUN_ID="${SMOKE_RUN_ID:-$(date -u +%Y%m%d%H%M%S)-$$}"
USER_ID="${USER_ID:-platform-lab-smoke-${SMOKE_RUN_ID}}"
LAB_SLUG="${LAB_SLUG:-trace-service-to-pod}"
EXPECTED_LABS="${EXPECTED_LABS:-21}"
EXPECTED_PORTFOLIO_LABS="${EXPECTED_PORTFOLIO_LABS:-12}"
PLATFORM_SOURCE_BUNDLE_TOKEN="${PLATFORM_SOURCE_BUNDLE_TOKEN:-}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-30}"
SMOKE_DRY_RUN="${SMOKE_DRY_RUN:-false}"
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
require_non_negative_integer EXPECTED_LABS "${EXPECTED_LABS}"
require_non_negative_integer EXPECTED_PORTFOLIO_LABS "${EXPECTED_PORTFOLIO_LABS}"
require_positive_integer CURL_CONNECT_TIMEOUT "${CURL_CONNECT_TIMEOUT}"
require_positive_integer CURL_MAX_TIME "${CURL_MAX_TIME}"

tmpdir="$(mktemp -d)"
trap 'rm -rf "${tmpdir}"' EXIT

echo "Smoke testing Platform Academy labs at ${API_BASE}"
echo "Smoke USER_ID=${USER_ID}"
echo "Smoke LAB_SLUG=${LAB_SLUG}"

if [[ ! "${USER_ID}" =~ ^[A-Za-z0-9._:-]+$ ]]; then
  fail "USER_ID may only contain letters, numbers, dot, underscore, colon, and hyphen for shell-safe smoke JSON."
fi
if [[ ! "${LAB_SLUG}" =~ ^[a-z0-9-]+$ ]]; then
  fail "LAB_SLUG may only contain lowercase letters, numbers, and hyphen."
fi
case "${PLATFORM_SOURCE_BUNDLE_TOKEN}" in
  *$'\n'*|*$'\r'*) fail "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines." ;;
esac
if [ "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" = "true" ] && [ -z "${PLATFORM_SOURCE_BUNDLE_TOKEN}" ]; then
  fail "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true"
fi

echo "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}"
if [ -n "${PLATFORM_SOURCE_BUNDLE_TOKEN}" ]; then
  echo "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set"
else
  echo "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=unset"
fi

if [ "${SMOKE_DRY_RUN}" = "true" ]; then
  echo "Dry run only; lab smoke options are valid."
  exit 0
fi

curl_smoke() {
  curl --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -fsS "$@"
}

require_no_store_headers() {
  local label="$1"
  local headers="$2"
  if ! grep -iq '^cache-control:.*no-store' "${headers}"; then
    echo "Expected Cache-Control: no-store for ${label}" >&2
    cat "${headers}" >&2
    exit 1
  fi
  if ! grep -iq '^pragma:.*no-cache' "${headers}"; then
    echo "Expected Pragma: no-cache for ${label}" >&2
    cat "${headers}" >&2
    exit 1
  fi
}

source_bundle_curl_args=()
if [ -n "${PLATFORM_SOURCE_BUNDLE_TOKEN}" ]; then
  source_bundle_curl_args=(-H "X-Platform-Source-Bundle-Token: ${PLATFORM_SOURCE_BUNDLE_TOKEN}")
fi

curl_smoke "${API_BASE}/healthz" >/dev/null

curl_smoke "${API_BASE}/api/platform-academy/labs" >"${tmpdir}/labs.json"
"${python_bin}" - "${tmpdir}/labs.json" "${EXPECTED_LABS}" "${EXPECTED_PORTFOLIO_LABS}" "${tmpdir}/lab-slugs.txt" <<'PY'
import json
import sys
from pathlib import PurePosixPath

path, expected_count, expected_portfolio_count, slug_list_path = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
with open(path, encoding="utf-8") as handle:
    labs = json.load(handle)

if len(labs) != expected_count:
    raise SystemExit(f"expected {expected_count} labs, got {len(labs)}")

non_full = [lab["slug"] for lab in labs if lab.get("lab_tier") != "full"]
if non_full:
    raise SystemExit(f"expected all labs to be full tier, got non-full labs: {non_full}")
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
expected_cluster_slugs = {
    "trace-service-to-pod",
    "debug-crashloop-imagepull",
    "trace-network-path",
    "debug-aws-alb-health-path",
    "audit-tenant-boundaries",
}
portfolio_labs = [lab for lab in labs if lab.get("portfolio_grade") is True]
if len(portfolio_labs) != expected_portfolio_count:
    raise SystemExit(f"expected {expected_portfolio_count} portfolio-grade labs, got {len(portfolio_labs)}")
if {lab["slug"] for lab in portfolio_labs} != expected_portfolio_slugs:
    raise SystemExit(f"unexpected portfolio-grade labs: {sorted(lab['slug'] for lab in portfolio_labs)}")
if any(not lab.get("portfolio_focus") for lab in portfolio_labs):
    raise SystemExit("portfolio-grade labs must expose portfolio_focus")

required_learner_contract = {"evidence-template.md", "validate.sh", "cleanup.sh"}
for lab in labs:
    slug = lab["slug"]
    artifact_names = {PurePosixPath(path).name for path in lab.get("artifact_paths", [])}
    missing = sorted(required_learner_contract - artifact_names)
    if missing:
        raise SystemExit(f"{slug} missing learner artifacts: {missing}")
    learner_artifacts = lab.get("learner_artifact_paths", [])
    if not learner_artifacts:
        raise SystemExit(f"{slug} missing learner_artifact_paths")
    if learner_artifacts != lab.get("artifact_paths", []):
        raise SystemExit(f"{slug} public artifact_paths should match learner_artifact_paths")
    if any(path.endswith("/solution.md") for path in learner_artifacts):
        raise SystemExit(f"{slug} learner_artifact_paths should not expose solution.md")
    if any(path.endswith("/README.md") for path in learner_artifacts):
        raise SystemExit(f"{slug} learner_artifact_paths should not expose source README.md")
    for key in ["setup_commands", "validation_commands", "cleanup_commands", "worksheet_prompts", "rubric", "validation_checks"]:
        if not lab.get(key):
            raise SystemExit(f"{slug} missing {key}")
    cluster_commands = lab.get("cluster_workspace_commands") or []
    cluster_text = "\n".join(cluster_commands)
    if slug in expected_cluster_slugs:
        for snippet in [
            f"bootstrap-local-cluster.sh --preflight {slug}",
            "./setup.sh --preflight",
            "./setup.sh --cluster",
            "./validate.sh --cluster",
            "No app namespace or Pods need to exist before setup",
        ]:
            if snippet not in cluster_text:
                raise SystemExit(f"{slug} missing cluster workspace command snippet: {snippet}")
    elif cluster_commands:
        raise SystemExit(f"{slug} should not expose cluster workspace commands")

with open(slug_list_path, "w", encoding="utf-8") as handle:
    for lab in labs:
        handle.write(f"{lab['slug']}\n")

print(f"Validated {len(labs)} full lab payloads")
PY

packet_count=0
while IFS= read -r packet_slug; do
  [ -n "${packet_slug}" ] || continue
  packet_headers="${tmpdir}/${packet_slug}-packet.headers"
  packet_path="${tmpdir}/${packet_slug}-packet.md"
  curl_smoke -D "${packet_headers}" -o "${packet_path}" "${API_BASE}/api/platform-academy/labs/${packet_slug}/packet"
  require_no_store_headers "${packet_slug} lab packet" "${packet_headers}"
  if ! grep -iq '^content-type:.*text/markdown' "${packet_headers}"; then
    echo "Expected text/markdown packet content type for ${packet_slug}" >&2
    cat "${packet_headers}" >&2
    exit 1
  fi
  if ! grep -iq "content-disposition:.*${packet_slug}-lab-packet.md" "${packet_headers}"; then
    echo "Expected packet content disposition for ${packet_slug}" >&2
    cat "${packet_headers}" >&2
    exit 1
  fi
  "${python_bin}" - "${tmpdir}/labs.json" "${packet_path}" "${packet_slug}" <<'PY'
import json
import sys

labs_path, packet_path, slug = sys.argv[1], sys.argv[2], sys.argv[3]
with open(labs_path, encoding="utf-8") as handle:
    labs = json.load(handle)
lab = next((item for item in labs if item["slug"] == slug), None)
if not lab:
    raise SystemExit(f"{slug} was not present in labs payload")

with open(packet_path, encoding="utf-8") as handle:
    packet = handle.read()

required_sections = [
    f"# {lab['title']}",
    "## Scenario",
    "## Guided run sequence",
    "## Evidence artifact map",
    "## Learner artifact paths",
    "## Worksheet prompts",
    "## Local workspace",
    "## Validation commands",
    "## Validation checks",
    "## Rubric",
    "## Cleanup commands",
]
missing_sections = [section for section in required_sections if section not in packet]
if missing_sections:
    raise SystemExit(f"{slug} packet missing sections: {missing_sections}")
for phase in ["1. Prepare workspace", "2. Investigate safely", "3. Prove the finding", "4. Reset or hand off"]:
    if phase not in packet:
        raise SystemExit(f"{slug} packet missing guided run phase: {phase}")

for artifact_path in lab.get("learner_artifact_paths", []):
    if artifact_path not in packet:
        raise SystemExit(f"{slug} packet missing artifact path: {artifact_path}")
if "Self-check script" not in packet:
    raise SystemExit(f"{slug} packet missing artifact role labels")
if "/solution.md" in packet:
    raise SystemExit(f"{slug} packet should not expose solution.md in learner artifact paths")
if f"labs/platform-academy/{slug}/README.md" in packet:
    raise SystemExit(f"{slug} packet should not expose source README.md in learner artifact paths")
if "evidence-template.md" not in packet:
    raise SystemExit(f"{slug} packet missing evidence template reference")
if f"run-lab.sh workspace {slug}" not in packet:
    raise SystemExit(f"{slug} packet missing local workspace command")

print(f"Validated {slug} lab packet")
PY
  packet_count=$((packet_count + 1))
done <"${tmpdir}/lab-slugs.txt"

echo "Validated ${packet_count} Platform Academy lab packets"

bundle_count=0
while IFS= read -r bundle_slug; do
  [ -n "${bundle_slug}" ] || continue
  source_extract_dir="${tmpdir}/${bundle_slug}-source"
  if [ "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" = "true" ]; then
    denied_body="${tmpdir}/${bundle_slug}-source-bundle-denied.json"
    denied_headers="${tmpdir}/${bundle_slug}-source-bundle-denied.headers"
    denied_status="$(
      curl --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" \
        -sS -D "${denied_headers}" -o "${denied_body}" -w "%{http_code}" \
        "${API_BASE}/api/platform-academy/labs/${bundle_slug}/bundle"
    )" || fail "Unauthenticated source bundle check failed for ${bundle_slug}"
    require_no_store_headers "${bundle_slug} denied source bundle" "${denied_headers}"
    if [ "${denied_status}" != "403" ]; then
      fail "Expected unauthenticated source bundle request for ${bundle_slug} to return 403, got ${denied_status}"
    fi
    if ! grep -iq "instructor token" "${denied_body}"; then
      echo "Expected unauthenticated source bundle denial for ${bundle_slug} to mention instructor token" >&2
      cat "${denied_body}" >&2 || true
      exit 1
    fi
  fi
  source_headers="${tmpdir}/${bundle_slug}-source-bundle.headers"
  curl_smoke "${source_bundle_curl_args[@]}" -D "${source_headers}" -o "${tmpdir}/${bundle_slug}.zip" "${API_BASE}/api/platform-academy/labs/${bundle_slug}/bundle"
  require_no_store_headers "${bundle_slug} source bundle" "${source_headers}"
  if ! grep -iq '^content-type:.*application/zip' "${source_headers}"; then
    echo "Expected application/zip source bundle content type for ${bundle_slug}" >&2
    cat "${source_headers}" >&2
    exit 1
  fi
  if ! grep -iq "content-disposition:.*${bundle_slug}-lab-bundle.zip" "${source_headers}"; then
    echo "Expected source bundle content disposition for ${bundle_slug}" >&2
    cat "${source_headers}" >&2
    exit 1
  fi
  "${python_bin}" - "${tmpdir}/labs.json" "${tmpdir}/${bundle_slug}.zip" "${tmpdir}/${bundle_slug}-packet.md" "${bundle_slug}" "${source_extract_dir}" <<'PY'
import json
import sys
from pathlib import Path
from zipfile import ZipFile

labs_path, zip_path, packet_path, slug, extract_dir_arg = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
with open(labs_path, encoding="utf-8") as handle:
    labs = json.load(handle)
lab = next((item for item in labs if item["slug"] == slug), None)
if not lab:
    raise SystemExit(f"{slug} was not present in labs payload")
with open(packet_path, encoding="utf-8") as handle:
    expected_packet = handle.read()

extract_dir = Path(extract_dir_arg).resolve()
extract_dir.mkdir(parents=True, exist_ok=True)
with ZipFile(zip_path) as archive:
    name_list = archive.namelist()
    names = set(name_list)
    if len(name_list) != len(names):
        raise SystemExit(f"{slug} bundle contains duplicate entries")
    bad_names = sorted(name for name in names if not name.startswith(f"{slug}/"))
    if bad_names:
        raise SystemExit(f"{slug} bundle contains unexpected paths: {bad_names}")
    for member in archive.infolist():
        target = (extract_dir / member.filename).resolve()
        try:
            target.relative_to(extract_dir)
        except ValueError as exc:
            raise SystemExit(f"{slug} bundle contains unsafe extraction path: {member.filename}") from exc

    required = {
        f"{slug}/README.md",
        f"{slug}/SOURCE-MANIFEST.txt",
    }
    manifest = archive.read(f"{slug}/SOURCE-MANIFEST.txt").decode()
    source_artifacts = [line[2:] for line in manifest.splitlines() if line.startswith("- labs/platform-academy/")]
    source_names = {artifact.rsplit("/", 1)[-1] for artifact in source_artifacts}
    missing_source_contract = sorted({"README.md", "solution.md", "validate.sh", "cleanup.sh"} - source_names)
    if missing_source_contract:
        raise SystemExit(f"{slug} source manifest missing full-lab artifacts: {missing_source_contract}")
    required.update(f"{slug}/{artifact_path}" for artifact_path in source_artifacts)
    missing = sorted(required - names)
    if missing:
        raise SystemExit(f"{slug} bundle missing entries: {missing}")

    empty = sorted(name for name in required if archive.getinfo(name).file_size == 0)
    if empty:
        raise SystemExit(f"{slug} bundle has empty required entries: {empty}")
    embedded_packet = archive.read(f"{slug}/README.md").decode()
    if embedded_packet != expected_packet:
        raise SystemExit(f"{slug} bundle README does not match standalone packet endpoint")

    for script_name in ["validate.sh", "cleanup.sh"]:
        member = f"{slug}/labs/platform-academy/{slug}/{script_name}"
        mode = archive.getinfo(member).external_attr >> 16
        if mode and not (mode & 0o111):
            raise SystemExit(f"{slug} bundle script is not executable: {member}")
    archive.extractall(extract_dir)
PY
  bash -n "${source_extract_dir}/${bundle_slug}/labs/platform-academy/${bundle_slug}/validate.sh"
  bash -n "${source_extract_dir}/${bundle_slug}/labs/platform-academy/${bundle_slug}/cleanup.sh"
  bundle_count=$((bundle_count + 1))
done <"${tmpdir}/lab-slugs.txt"

if [ "${SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED}" = "true" ]; then
  echo "Verified source bundle token gate for ${bundle_count} Platform Academy source bundles"
fi
echo "Validated ${bundle_count} Platform Academy artifact bundles and source helper scripts"

workspace_bundle_count=0
while IFS= read -r bundle_slug; do
  [ -n "${bundle_slug}" ] || continue
  workspace_extract_dir="${tmpdir}/${bundle_slug}-workspace"
  workspace_headers="${tmpdir}/${bundle_slug}-workspace-bundle.headers"
  curl_smoke -D "${workspace_headers}" -o "${tmpdir}/${bundle_slug}-workspace.zip" "${API_BASE}/api/platform-academy/labs/${bundle_slug}/workspace-bundle"
  require_no_store_headers "${bundle_slug} learner workspace bundle" "${workspace_headers}"
  if ! grep -iq '^content-type:.*application/zip' "${workspace_headers}"; then
    echo "Expected application/zip workspace bundle content type for ${bundle_slug}" >&2
    cat "${workspace_headers}" >&2
    exit 1
  fi
  if ! grep -iq "content-disposition:.*${bundle_slug}-learner-workspace.zip" "${workspace_headers}"; then
    echo "Expected workspace bundle content disposition for ${bundle_slug}" >&2
    cat "${workspace_headers}" >&2
    exit 1
  fi
  "${python_bin}" - "${tmpdir}/labs.json" "${tmpdir}/${bundle_slug}-workspace.zip" "${bundle_slug}" "${workspace_extract_dir}" <<'PY'
import json
import sys
from pathlib import Path
from zipfile import ZipFile

labs_path, zip_path, slug, extract_dir_arg = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
with open(labs_path, encoding="utf-8") as handle:
    labs = json.load(handle)
lab = next((item for item in labs if item["slug"] == slug), None)
if not lab:
    raise SystemExit(f"{slug} was not present in labs payload")

extract_dir = Path(extract_dir_arg).resolve()
extract_dir.mkdir(parents=True, exist_ok=True)
with ZipFile(zip_path) as archive:
    names = set(archive.namelist())
    required = {
        f"{slug}/README.md",
        f"{slug}/evidence.md",
        f"{slug}/MANIFEST.txt",
        f"{slug}/setup.sh",
        f"{slug}/validate.sh",
        f"{slug}/cleanup.sh",
    }
    missing_required = sorted(required - names)
    if missing_required:
        raise SystemExit(f"{slug} workspace bundle missing entries: {missing_required}")
    for script_name in ["setup.sh", "validate.sh", "cleanup.sh"]:
        member = f"{slug}/{script_name}"
        mode = archive.getinfo(member).external_attr >> 16
        if not mode & 0o111:
            raise SystemExit(f"{slug} workspace helper is not executable: {member}")
    if any(name.endswith("/solution.md") for name in names):
        raise SystemExit(f"{slug} workspace bundle must not include solution.md")
    if f"{slug}/artifacts/labs/platform-academy/{slug}/README.md" in names:
        raise SystemExit(f"{slug} workspace bundle should not include source README.md")
    for artifact_path in lab.get("learner_artifact_paths", []):
        member = f"{slug}/artifacts/{artifact_path}"
        if member not in names:
            raise SystemExit(f"{slug} workspace bundle missing artifact: {member}")
    manifest = archive.read(f"{slug}/MANIFEST.txt").decode()
    if "Withheld source-only artifacts" not in manifest:
        raise SystemExit(f"{slug} workspace manifest should document withheld source-only artifacts")
    for withheld in [f"labs/platform-academy/{slug}/README.md", f"labs/platform-academy/{slug}/solution.md"]:
        if withheld not in manifest:
            raise SystemExit(f"{slug} workspace manifest should document withheld artifact: {withheld}")
    for snippet in ["./setup.sh", "./validate.sh --files-only", "./cleanup.sh"]:
        if snippet not in manifest:
            raise SystemExit(f"{slug} workspace manifest missing quick-start snippet: {snippet}")
    readme = archive.read(f"{slug}/README.md").decode()
    has_cluster_workflow = any("--preflight" in command for command in lab.get("setup_commands", [])) and any(
        "--cluster" in command and "validate" in command for command in lab.get("validation_commands", [])
    )
    if has_cluster_workflow:
        for snippet in [
            "Optional cluster workflow",
            f"bootstrap-local-cluster.sh --preflight {slug}",
            "./setup.sh --preflight",
            "./setup.sh --cluster",
            "./validate.sh --cluster",
            "No app namespace or Pods need to exist before setup",
        ]:
            if snippet not in manifest:
                raise SystemExit(f"{slug} workspace manifest missing cluster workflow snippet: {snippet}")
            if snippet not in readme:
                raise SystemExit(f"{slug} workspace README missing cluster workflow snippet: {snippet}")
    elif "Optional cluster workflow" in manifest or "Optional cluster workflow" in readme:
        raise SystemExit(f"{slug} non-cluster workspace should not include cluster workflow snippets")
    for member in archive.infolist():
        target = (extract_dir / member.filename).resolve()
        try:
            target.relative_to(extract_dir)
        except ValueError as exc:
            raise SystemExit(f"{slug} workspace bundle contains unsafe extraction path: {member.filename}") from exc
    archive.extractall(extract_dir)
PY
  bash -n "${workspace_extract_dir}/${bundle_slug}/setup.sh"
  bash -n "${workspace_extract_dir}/${bundle_slug}/validate.sh"
  bash -n "${workspace_extract_dir}/${bundle_slug}/cleanup.sh"
  (
    cd "${workspace_extract_dir}/${bundle_slug}"
    bash ./validate.sh --files-only
  )
  workspace_bundle_count=$((workspace_bundle_count + 1))
done <"${tmpdir}/lab-slugs.txt"

echo "Validated ${workspace_bundle_count} Platform Academy learner workspace bundles and file-check helpers"

curl_smoke "${API_BASE}/api/platform-academy/labs/${LAB_SLUG}/submission/${USER_ID}" >"${tmpdir}/initial-submission.json"
curl_smoke -X POST "${API_BASE}/api/platform-academy/labs/${LAB_SLUG}/submission" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"worksheet_answers\":{\"worksheet-0\":\"Smoke evidence includes selector, endpoint, validation, cleanup, and rollback notes.\"},\"checked_items\":{\"worksheet-0\":true,\"validation-0\":true},\"status\":\"submitted\"}" \
  >"${tmpdir}/submission.json"
"${python_bin}" - "${tmpdir}/submission.json" "${LAB_SLUG}" <<'PY'
import json
import sys

path, expected_slug = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as handle:
    payload = json.load(handle)

if payload.get("lab_slug") != expected_slug:
    raise SystemExit(f"submission returned wrong lab slug: {payload.get('lab_slug')}")
if payload.get("status") != "submitted":
    raise SystemExit(f"submission status was not submitted: {payload.get('status')}")
if payload.get("score", 0) <= 0:
    raise SystemExit(f"submission score did not update: {payload.get('score')}")

print(f"Validated {expected_slug} submission persistence")
PY

curl_smoke "${API_BASE}/api/platform-academy/lab-submissions/${USER_ID}" >"${tmpdir}/submissions.json"
"${python_bin}" - "${tmpdir}/submissions.json" "${LAB_SLUG}" <<'PY'
import json
import sys

path, expected_slug = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as handle:
    submissions = json.load(handle)

if expected_slug not in {item.get("lab_slug") for item in submissions}:
    raise SystemExit(f"{expected_slug} was not returned from lab submission history")

print(f"Validated lab submission history for {expected_slug}")
PY

echo "Platform Academy lab smoke passed for ${API_BASE}"
