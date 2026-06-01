#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_SMOKE="$ROOT/scripts/smoke_platform_academy_api.sh"
LAB_SMOKE="$ROOT/scripts/smoke_platform_academy_labs.sh"
DEPLOYED_SMOKE="$ROOT/scripts/smoke_platform_academy_deployed.sh"
CONTAINER_SMOKE="$ROOT/scripts/smoke_platform_academy_container.sh"
API_IMAGE_MIGRATION_CHECK="$ROOT/scripts/verify_api_image_migrations.sh"
FULL_LABS_VERIFY="$ROOT/labs/platform-academy/verify-full-labs.sh"
WORKING_TREE_HYGIENE_TARGET=(make -C "$ROOT" --no-print-directory working-tree-hygiene-check)
RELEASE_EVIDENCE_TARGET=(make -C "$ROOT" --no-print-directory platform-release-evidence)
LAB_MATRIX_TARGET=(make -C "$ROOT" --no-print-directory platform-lab-matrix)
REVIEW_MANIFEST_TARGET=(make -C "$ROOT" --no-print-directory platform-review-manifest)
REVIEW_PACK_TARGET=(make -C "$ROOT" --no-print-directory platform-review-pack)
REVIEW_PACK_DIR="/tmp/on-demand-platform-review-pack-self-test-$$"
CLEANUP_TEST_DIR="/tmp/on-demand-clean-generated-self-test-$$"

trap 'rm -rf "$REVIEW_PACK_DIR" "$CLEANUP_TEST_DIR"' EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

expect_success() {
  local label="$1"
  shift
  local output
  if ! output="$("$@" 2>&1)"; then
    echo "$output" >&2
    fail "${label} should have succeeded"
  fi
  printf '%s\n' "$output"
}

expect_failure() {
  local label="$1"
  local expected="$2"
  shift 2
  local output
  set +e
  output="$("$@" 2>&1)"
  local status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    echo "$output" >&2
    fail "${label} should have failed"
  fi
  if ! grep -q "$expected" <<<"$output"; then
    echo "$output" >&2
    fail "${label} did not include expected message: ${expected}"
  fi
}

release_evidence_output="$(expect_success "release evidence target" "${RELEASE_EVIDENCE_TARGET[@]}")"
release_evidence_first_line="$(sed -n '1p' <<<"$release_evidence_output")"
[[ "$release_evidence_first_line" == "# Platform Academy Release Evidence" ]] || fail "release evidence output should start with Markdown heading"
grep -q "Branch:" <<<"$release_evidence_output" || fail "release evidence output did not include branch"
grep -q "Commit:" <<<"$release_evidence_output" || fail "release evidence output did not include commit"
grep -q "## Cleanup Status" <<<"$release_evidence_output" || fail "release evidence output did not include cleanup status"
grep -q "## Reviewer Routing" <<<"$release_evidence_output" || fail "release evidence output did not include reviewer routing"
grep -q "make working-tree-hygiene-check" <<<"$release_evidence_output" || fail "release evidence output did not include working-tree hygiene gate"
grep -q "make platform-review-manifest" <<<"$release_evidence_output" || fail "release evidence output did not include review manifest helper"
grep -q "content-count contract, workflow contract" <<<"$release_evidence_output" || fail "release evidence output did not describe review-pack contracts"
if grep -q "scripts/platform_release_evidence.sh" <<<"$release_evidence_output"; then
  fail "release evidence target should not echo the script command"
fi

lab_matrix_output="$(expect_success "lab matrix target" "${LAB_MATRIX_TARGET[@]}")"
lab_matrix_first_line="$(sed -n '1p' <<<"$lab_matrix_output")"
[[ "$lab_matrix_first_line" == "# Platform Academy Lab Review Matrix" ]] || fail "lab matrix output should start with Markdown heading"
grep -q "| Lab | Portfolio focus | Structural gate | Mode | Track | Time | Learner files | Source files | Evidence self-check |" <<<"$lab_matrix_output" || fail "lab matrix output did not include table header"
lab_matrix_rows="$(grep -c '^| `' <<<"$lab_matrix_output")"
[[ "$lab_matrix_rows" == "21" ]] || fail "lab matrix should include 21 lab rows, got ${lab_matrix_rows}"
grep -q '| `trace-service-to-pod` | Kubernetes Service routing | yes |' <<<"$lab_matrix_output" || fail "lab matrix missing trace-service-to-pod portfolio metadata"
grep -q '| `design-safe-release-pipeline` | production release safety | yes |' <<<"$lab_matrix_output" || fail "lab matrix missing design-safe-release-pipeline portfolio metadata"
grep -q 'build-platform-career-proof-pack' <<<"$lab_matrix_output" || fail "lab matrix missing build-platform-career-proof-pack"
grep -q 'Rows with `Structural gate` set to `yes`' <<<"$lab_matrix_output" || fail "lab matrix missing structural gate note"

working_tree_hygiene_output="$(expect_success "working tree hygiene target" "${WORKING_TREE_HYGIENE_TARGET[@]}")"
grep -q "Verified working-tree hygiene" <<<"$working_tree_hygiene_output" || fail "working tree hygiene target did not report success"

review_manifest_output="$(expect_success "review manifest target" "${REVIEW_MANIFEST_TARGET[@]}")"
grep -q "# Platform Academy Changed File Review Manifest" <<<"$review_manifest_output" || fail "review manifest missing heading"
grep -q "Lab Source Artifacts" <<<"$review_manifest_output" || fail "review manifest missing lab section"
grep -q "Release, Deployment, And Smoke Tooling" <<<"$review_manifest_output" || fail "review manifest missing release section"

review_pack_output="$(
  expect_success "review pack target" \
    env PLATFORM_REVIEW_PACK_DIR="$REVIEW_PACK_DIR" "${REVIEW_PACK_TARGET[@]}"
)"
grep -q "Platform Academy review pack written to" <<<"$review_pack_output" || fail "review pack output did not report output directory"
grep -q "release-evidence.md" <<<"$review_pack_output" || fail "review pack output did not list release evidence"
grep -q "changed-file-review-manifest.md" <<<"$review_pack_output" || fail "review pack output did not list changed-file manifest"
grep -q "commit-plan.md" <<<"$review_pack_output" || fail "review pack output did not list commit plan"
grep -q "pathspec-release.txt" <<<"$review_pack_output" || fail "review pack output did not list release pathspec"
grep -q "lab-review-matrix.md" <<<"$review_pack_output" || fail "review pack output did not list lab matrix"
grep -q "review-scope.md" <<<"$review_pack_output" || fail "review pack output did not list review scope"
grep -q "portfolio-artifact-contract.txt" <<<"$review_pack_output" || fail "review pack output did not list portfolio artifact contract"
grep -q "content-count-contract.txt" <<<"$review_pack_output" || fail "review pack output did not list content count contract"
grep -q "workflow-contracts.txt" <<<"$review_pack_output" || fail "review pack output did not list workflow contract"
for pack_file in README.md FILE-MANIFEST.txt release-evidence.md changed-file-review-manifest.md commit-plan.md pathspec-release.txt pathspec-api.txt pathspec-labs.txt pathspec-ui.txt pathspec-docs.txt lab-review-matrix.md review-scope.md portfolio-artifact-contract.txt content-count-contract.txt workflow-contracts.txt platform-academy-handoff.md release-checklist.md pull-request-template.md git-status.txt tracked-diffstat.txt tracked-name-status.txt untracked-files.txt; do
  [ -f "$REVIEW_PACK_DIR/$pack_file" ] || fail "review pack missing ${pack_file}"
done
grep -q "# Platform Academy Review Pack" "$REVIEW_PACK_DIR/README.md" || fail "review pack README missing heading"
grep -q "make platform-deployed-smoke" "$REVIEW_PACK_DIR/README.md" || fail "review pack README missing deployed smoke command"
grep -q "# Platform Academy Release Evidence" "$REVIEW_PACK_DIR/release-evidence.md" || fail "review pack release evidence missing heading"
grep -q "# Platform Academy Changed File Review Manifest" "$REVIEW_PACK_DIR/changed-file-review-manifest.md" || fail "review pack changed-file manifest missing heading"
grep -q "Lab Source Artifacts" "$REVIEW_PACK_DIR/changed-file-review-manifest.md" || fail "review pack changed-file manifest missing lab section"
grep -q "# Platform Academy Commit Plan" "$REVIEW_PACK_DIR/commit-plan.md" || fail "review pack commit plan missing heading"
grep -q "while IFS= read -r file_path; do git add --" "$REVIEW_PACK_DIR/commit-plan.md" || fail "review pack commit plan missing staging commands"
grep -q "scripts/platform_review_pack.sh" "$REVIEW_PACK_DIR/pathspec-release.txt" || fail "review pack release pathspec missing review pack script"
grep -q "apps/api/app/main.py" "$REVIEW_PACK_DIR/pathspec-api.txt" || fail "review pack API pathspec missing main API file"
grep -q "labs/platform-academy/trace-service-to-pod/README.md" "$REVIEW_PACK_DIR/pathspec-labs.txt" || fail "review pack labs pathspec missing trace-service lab"
grep -q "apps/platform-academy/src/App.tsx" "$REVIEW_PACK_DIR/pathspec-ui.txt" || fail "review pack UI pathspec missing App.tsx"
grep -q "docs/platform-academy-handoff.md" "$REVIEW_PACK_DIR/pathspec-docs.txt" || fail "review pack docs pathspec missing handoff doc"
grep -q "# Platform Academy Lab Review Matrix" "$REVIEW_PACK_DIR/lab-review-matrix.md" || fail "review pack lab matrix missing heading"
grep -q "# Platform Academy Review Scope" "$REVIEW_PACK_DIR/review-scope.md" || fail "review pack review scope missing heading"
grep -q "Changed files, tracked plus untracked:" "$REVIEW_PACK_DIR/review-scope.md" || fail "review pack review scope missing changed file count"
grep -q "Suggested Review Order" "$REVIEW_PACK_DIR/review-scope.md" || fail "review pack review scope missing review order"
grep -q "| \`trace-service-to-pod\` | Kubernetes Service routing | yes |" "$REVIEW_PACK_DIR/lab-review-matrix.md" || fail "review pack lab matrix missing trace-service-to-pod portfolio metadata"
grep -q "Verified structural artifacts for 7 Platform Academy portfolio labs." "$REVIEW_PACK_DIR/portfolio-artifact-contract.txt" || fail "review pack portfolio artifact contract missing verifier output"
grep -q "Verified Platform Academy content counts: courses=21, lessons=84, labs=21, portfolio=7, resources=320, packs=22, questions=219." "$REVIEW_PACK_DIR/content-count-contract.txt" || fail "review pack content count contract missing verifier output"
grep -q "Verified GitHub Actions release workflow contracts." "$REVIEW_PACK_DIR/workflow-contracts.txt" || fail "review pack workflow contract missing verifier output"
expect_failure "review pack positional argument validation" "does not accept positional arguments" \
  "$ROOT/scripts/platform_review_pack.sh" unexpected-arg

mkdir -p \
  "$CLEANUP_TEST_DIR/.pytest_cache" \
  "$CLEANUP_TEST_DIR/apps/api/.pytest_cache" \
  "$CLEANUP_TEST_DIR/apps/worker/.pytest_cache" \
  "$CLEANUP_TEST_DIR/apps/frontend/.vite" \
  "$CLEANUP_TEST_DIR/apps/frontend/dist" \
  "$CLEANUP_TEST_DIR/apps/frontend/playwright-report" \
  "$CLEANUP_TEST_DIR/apps/frontend/test-results" \
  "$CLEANUP_TEST_DIR/apps/frontend/coverage" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/.vite" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/dist" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/playwright-report" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/test-results" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/coverage" \
  "$CLEANUP_TEST_DIR/smoke-artifacts" \
  "$CLEANUP_TEST_DIR/scripts/__pycache__" \
  "$CLEANUP_TEST_DIR/labs/platform-academy/__pycache__"
touch \
  "$CLEANUP_TEST_DIR/.pytest_cache/cache" \
  "$CLEANUP_TEST_DIR/apps/api/.pytest_cache/cache" \
  "$CLEANUP_TEST_DIR/apps/api/test.db" \
  "$CLEANUP_TEST_DIR/apps/api/ci-test.db" \
  "$CLEANUP_TEST_DIR/apps/api/ci-smoke.db" \
  "$CLEANUP_TEST_DIR/apps/frontend/.vite/cache" \
  "$CLEANUP_TEST_DIR/apps/frontend/dist/index.html" \
  "$CLEANUP_TEST_DIR/apps/frontend/playwright-report/index.html" \
  "$CLEANUP_TEST_DIR/apps/frontend/test-results/result.txt" \
  "$CLEANUP_TEST_DIR/apps/frontend/coverage/index.html" \
  "$CLEANUP_TEST_DIR/apps/frontend/tsconfig.tsbuildinfo" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/.vite/cache" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/dist/index.html" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/playwright-report/index.html" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/test-results/result.txt" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/coverage/index.html" \
  "$CLEANUP_TEST_DIR/apps/platform-academy/tsconfig.tsbuildinfo" \
  "$CLEANUP_TEST_DIR/test.db" \
  "$CLEANUP_TEST_DIR/ci-platform-browser-smoke.db" \
  "$CLEANUP_TEST_DIR/smoke-artifacts/smoke.txt" \
  "$CLEANUP_TEST_DIR/scripts/__pycache__/module.pyc" \
  "$CLEANUP_TEST_DIR/labs/platform-academy/__pycache__/module.pyc"
expect_success "clean-generated target in disposable tree" make -f "$ROOT/Makefile" -C "$CLEANUP_TEST_DIR" --no-print-directory clean-generated >/dev/null
if find "$CLEANUP_TEST_DIR" \
  \( -name '.pytest_cache' -o -name '__pycache__' -o -name '*.tsbuildinfo' -o -name 'test.db' -o -name 'ci-test.db' -o -name 'ci-smoke.db' -o -name 'ci-platform-browser-smoke.db' -o -name 'dist' -o -name '.vite' -o -name 'playwright-report' -o -name 'test-results' -o -name 'coverage' -o -name 'smoke-artifacts' \) \
  -print | grep -q .; then
  find "$CLEANUP_TEST_DIR" \
    \( -name '.pytest_cache' -o -name '__pycache__' -o -name '*.tsbuildinfo' -o -name 'test.db' -o -name 'ci-test.db' -o -name 'ci-smoke.db' -o -name 'ci-platform-browser-smoke.db' -o -name 'dist' -o -name '.vite' -o -name 'playwright-report' -o -name 'test-results' -o -name 'coverage' -o -name 'smoke-artifacts' \) \
    -print >&2
  fail "clean-generated did not remove all disposable generated artifacts"
fi

dry_run_output="$(
  expect_success "deployed smoke dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test WEB_BASE=https://web.example.test "$DEPLOYED_SMOKE"
)"
grep -q "Dry run only" <<<"$dry_run_output" || fail "deployed smoke dry run did not report dry-run mode"
grep -q "SMOKE_RUN_ID=self-test" <<<"$dry_run_output" || fail "deployed smoke dry run did not report SMOKE_RUN_ID"
grep -q "Smoke USER_ID=platform-api-smoke-self-test" <<<"$dry_run_output" || fail "deployed smoke dry run did not report derived USER_ID"
grep -q "SMOKE_VIEWPORTS=desktop,mobile" <<<"$dry_run_output" || fail "deployed smoke dry run did not report default SMOKE_VIEWPORTS"
grep -q "SMOKE_SKIP_LAB_SMOKE=false" <<<"$dry_run_output" || fail "deployed smoke dry run did not report default lab smoke setting"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=false" <<<"$dry_run_output" || fail "deployed smoke dry run did not report default source-bundle token expectation"

deployed_token_required_dry_run_output="$(
  expect_success "deployed smoke source-bundle token dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test WEB_BASE=https://web.example.test \
      PLATFORM_SOURCE_BUNDLE_TOKEN=source-token SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$DEPLOYED_SMOKE"
)"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" <<<"$deployed_token_required_dry_run_output" || fail "deployed smoke dry run did not report source-bundle token expectation"

api_dry_run_output="$(
  expect_success "api smoke dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test "$API_SMOKE"
)"
grep -q "Smoke USER_ID=platform-api-smoke-self-test" <<<"$api_dry_run_output" || fail "api smoke dry run did not use SMOKE_RUN_ID in default USER_ID"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=false" <<<"$api_dry_run_output" || fail "api smoke dry run did not report default source-bundle token expectation"
grep -q "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=unset" <<<"$api_dry_run_output" || fail "api smoke dry run did not report unset source-bundle token state"
grep -q "API smoke options are valid" <<<"$api_dry_run_output" || fail "api smoke dry run did not report valid options"

api_token_required_dry_run_output="$(
  expect_success "api smoke source-bundle token dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test \
      PLATFORM_SOURCE_BUNDLE_TOKEN=source-token SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$API_SMOKE"
)"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" <<<"$api_token_required_dry_run_output" || fail "api smoke dry run did not report source-bundle token expectation"
grep -q "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set" <<<"$api_token_required_dry_run_output" || fail "api smoke dry run did not report set source-bundle token state"

lab_dry_run_output="$(
  expect_success "lab smoke dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test "$LAB_SMOKE"
)"
grep -q "Smoke USER_ID=platform-lab-smoke-self-test" <<<"$lab_dry_run_output" || fail "lab smoke dry run did not use SMOKE_RUN_ID in default USER_ID"
grep -q "Smoke LAB_SLUG=trace-service-to-pod" <<<"$lab_dry_run_output" || fail "lab smoke dry run did not report default LAB_SLUG"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=false" <<<"$lab_dry_run_output" || fail "lab smoke dry run did not report default source-bundle token expectation"
grep -q "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=unset" <<<"$lab_dry_run_output" || fail "lab smoke dry run did not report unset source-bundle token state"
grep -q "lab smoke options are valid" <<<"$lab_dry_run_output" || fail "lab smoke dry run did not report valid options"

lab_token_required_dry_run_output="$(
  expect_success "lab smoke source-bundle token dry run" \
    env SMOKE_DRY_RUN=true SMOKE_RUN_ID=self-test API_BASE=https://api.example.test \
      PLATFORM_SOURCE_BUNDLE_TOKEN=source-token SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$LAB_SMOKE"
)"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" <<<"$lab_token_required_dry_run_output" || fail "lab smoke dry run did not report source-bundle token expectation"
grep -q "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set" <<<"$lab_token_required_dry_run_output" || fail "lab smoke dry run did not report set source-bundle token state"

container_dry_run_output="$(
  expect_success "container smoke dry run" \
    env SMOKE_DRY_RUN=true RUN_ID=self-test "$CONTAINER_SMOKE"
)"
grep -q "Platform Academy container smoke dry run" <<<"$container_dry_run_output" || fail "container smoke dry run did not report dry-run mode"
grep -q "RUN_ID=self-test" <<<"$container_dry_run_output" || fail "container smoke dry run did not report RUN_ID"
grep -q "API_CONTAINER=on-demand-platform-smoke-api-self-test" <<<"$container_dry_run_output" || fail "container smoke dry run did not derive API container name"
grep -q "SMOKE_SKIP_LAB_SMOKE=false" <<<"$container_dry_run_output" || fail "container smoke dry run did not report default lab smoke setting"
grep -q "API_ENVIRONMENT=preview" <<<"$container_dry_run_output" || fail "container smoke dry run did not report production-like API environment"
grep -q "PLATFORM_SOURCE_BUNDLE_PUBLIC=false" <<<"$container_dry_run_output" || fail "container smoke dry run did not report protected source-bundle mode"
grep -q "PLATFORM_SOURCE_BUNDLE_TOKEN_STATE=set" <<<"$container_dry_run_output" || fail "container smoke dry run did not report source-bundle token state"
grep -q "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" <<<"$container_dry_run_output" || fail "container smoke dry run did not report source-bundle token gate expectation"
grep -q "LAB_SMOKE_USER_ID=platform-container-lab-smoke-self-test" <<<"$container_dry_run_output" || fail "container smoke dry run did not derive lab smoke user id"

api_image_dry_run_output="$(
  expect_success "api image migration dry run" \
    env SMOKE_DRY_RUN=true RUN_ID=self-test "$API_IMAGE_MIGRATION_CHECK"
)"
grep -q "API image migration check dry run" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not report dry-run mode"
grep -q "RUN_ID=self-test" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not report RUN_ID"
grep -q "API_IMAGE=on-demand-api-release-check:self-test" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not derive default image"
grep -q "API_IMAGE_SKIP_BUILD=false" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not report default build mode"
grep -q "CLEAN_IMAGE=true" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not report default cleanup mode"
grep -q "CONTAINER_DB_PATH=/tmp/release-check.db" <<<"$api_image_dry_run_output" || fail "api image migration dry run did not report default DB path"

api_image_existing_dry_run_output="$(
  expect_success "api image migration existing-image dry run" \
    env SMOKE_DRY_RUN=true API_IMAGE=example.test/platform-api:candidate "$API_IMAGE_MIGRATION_CHECK"
)"
grep -q "API_IMAGE=example.test/platform-api:candidate" <<<"$api_image_existing_dry_run_output" || fail "api image migration dry run did not report provided image"
grep -q "API_IMAGE_SKIP_BUILD=true" <<<"$api_image_existing_dry_run_output" || fail "api image migration dry run should skip build for provided image"

expect_failure "api smoke origin validation" "API_BASE must start with http:// or https://" \
  env API_BASE=not-a-url "$API_SMOKE"
expect_failure "lab smoke origin validation" "API_BASE must start with http:// or https://" \
  env API_BASE=not-a-url "$LAB_SMOKE"
expect_failure "api smoke user id validation" "USER_ID may only contain" \
  env API_BASE=http://127.0.0.1:1 USER_ID="bad user" "$API_SMOKE"
expect_failure "api smoke user id length validation" "USER_ID must be 71 characters or fewer" \
  env API_BASE=http://127.0.0.1:1 USER_ID="$(printf 'x%.0s' {1..72})" "$API_SMOKE"
expect_failure "api smoke source bundle token validation" "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines" \
  env API_BASE=http://127.0.0.1:1 PLATFORM_SOURCE_BUNDLE_TOKEN=$'bad\ntoken' "$API_SMOKE"
expect_failure "api smoke source bundle expectation boolean validation" "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=maybe "$API_SMOKE"
expect_failure "api smoke required source bundle token validation" "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$API_SMOKE"
expect_failure "api smoke count validation" "EXPECTED_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test EXPECTED_LABS=twenty-one "$API_SMOKE"
expect_failure "api smoke portfolio count validation" "EXPECTED_PORTFOLIO_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test EXPECTED_PORTFOLIO_LABS=seven "$API_SMOKE"
expect_failure "api smoke curl timeout validation" "CURL_MAX_TIME must be an integer >= 1" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test CURL_MAX_TIME=0 "$API_SMOKE"
expect_failure "lab smoke user id validation" "USER_ID may only contain" \
  env API_BASE=http://127.0.0.1:1 USER_ID="bad user" "$LAB_SMOKE"
expect_failure "lab smoke slug validation" "LAB_SLUG may only contain" \
  env API_BASE=http://127.0.0.1:1 LAB_SLUG="bad/slug" "$LAB_SMOKE"
expect_failure "lab smoke source bundle token validation" "PLATFORM_SOURCE_BUNDLE_TOKEN must not contain newlines" \
  env API_BASE=http://127.0.0.1:1 PLATFORM_SOURCE_BUNDLE_TOKEN=$'bad\ntoken' "$LAB_SMOKE"
expect_failure "lab smoke source bundle expectation boolean validation" "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=maybe "$LAB_SMOKE"
expect_failure "lab smoke required source bundle token validation" "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$LAB_SMOKE"
expect_failure "lab smoke count validation" "EXPECTED_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test EXPECTED_LABS=twenty-one "$LAB_SMOKE"
expect_failure "lab smoke portfolio count validation" "EXPECTED_PORTFOLIO_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test EXPECTED_PORTFOLIO_LABS=seven "$LAB_SMOKE"
expect_failure "lab smoke curl timeout validation" "CURL_CONNECT_TIMEOUT must be an integer >= 1" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test CURL_CONNECT_TIMEOUT=zero "$LAB_SMOKE"
expect_failure "deployed smoke run id validation" "SMOKE_RUN_ID may only contain" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_RUN_ID="bad/run" "$DEPLOYED_SMOKE"
expect_failure "deployed smoke user id validation" "USER_ID may only contain" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test USER_ID="bad user" "$DEPLOYED_SMOKE"
expect_failure "deployed smoke user id length validation" "USER_ID must be 71 characters or fewer" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test USER_ID="$(printf 'x%.0s' {1..72})" "$DEPLOYED_SMOKE"
expect_failure "deployed smoke boolean validation" "SMOKE_SKIP_BROWSER must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_SKIP_BROWSER=maybe "$DEPLOYED_SMOKE"
expect_failure "deployed smoke browser boolean validation" "SMOKE_SKIP_ALL_RESOURCE_DETAILS must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_SKIP_ALL_RESOURCE_DETAILS=maybe "$DEPLOYED_SMOKE"
expect_failure "deployed smoke lab boolean validation" "SMOKE_SKIP_LAB_SMOKE must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_SKIP_LAB_SMOKE=maybe "$DEPLOYED_SMOKE"
expect_failure "deployed smoke source bundle expectation boolean validation" "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED must be true or false" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=maybe "$DEPLOYED_SMOKE"
expect_failure "deployed smoke required source bundle token validation" "PLATFORM_SOURCE_BUNDLE_TOKEN is required when SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true "$DEPLOYED_SMOKE"
expect_failure "deployed smoke viewport validation" "SMOKE_VIEWPORTS items must be" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_VIEWPORTS=desktop,bad "$DEPLOYED_SMOKE"
expect_failure "deployed smoke count validation" "SMOKE_EXPECTED_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_EXPECTED_LABS=twenty-one "$DEPLOYED_SMOKE"
expect_failure "deployed smoke portfolio count validation" "SMOKE_EXPECTED_PORTFOLIO_LABS must be an integer >= 0" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_EXPECTED_PORTFOLIO_LABS=seven "$DEPLOYED_SMOKE"
expect_failure "deployed smoke timeout validation" "SMOKE_TIMEOUT_MS must be an integer >= 1" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test SMOKE_TIMEOUT_MS=0 "$DEPLOYED_SMOKE"
expect_failure "deployed smoke curl timeout validation" "CURL_CONNECT_TIMEOUT must be an integer >= 1" \
  env SMOKE_DRY_RUN=true API_BASE=https://api.example.test WEB_BASE=https://web.example.test CURL_CONNECT_TIMEOUT=0 "$DEPLOYED_SMOKE"
expect_failure "container smoke run id validation" "RUN_ID may only contain" \
  env RUN_ID="bad/run" "$CONTAINER_SMOKE"
expect_failure "container smoke dry-run boolean validation" "SMOKE_DRY_RUN must be true or false" \
  env SMOKE_DRY_RUN=maybe RUN_ID=self-test "$CONTAINER_SMOKE"
expect_failure "container smoke skip-build boolean validation" "SMOKE_SKIP_BUILD must be true or false" \
  env SMOKE_DRY_RUN=true RUN_ID=self-test SMOKE_SKIP_BUILD=maybe "$CONTAINER_SMOKE"
expect_failure "container smoke lab boolean validation" "SMOKE_SKIP_LAB_SMOKE must be true or false" \
  env SMOKE_SKIP_LAB_SMOKE=maybe "$CONTAINER_SMOKE"
expect_failure "container smoke wait timeout validation" "CURL_WAIT_MAX_TIME must be an integer >= 1" \
  env SMOKE_DRY_RUN=true RUN_ID=self-test CURL_WAIT_MAX_TIME=fast "$CONTAINER_SMOKE"
expect_failure "api image migration run id validation" "RUN_ID may only contain" \
  env SMOKE_DRY_RUN=true RUN_ID="bad/run" "$API_IMAGE_MIGRATION_CHECK"
expect_failure "api image migration dry-run boolean validation" "DRY_RUN/SMOKE_DRY_RUN must be true or false" \
  env SMOKE_DRY_RUN=maybe RUN_ID=self-test "$API_IMAGE_MIGRATION_CHECK"
expect_failure "api image migration skip-build boolean validation" "API_IMAGE_SKIP_BUILD must be true or false" \
  env SMOKE_DRY_RUN=true RUN_ID=self-test API_IMAGE_SKIP_BUILD=maybe "$API_IMAGE_MIGRATION_CHECK"
expect_failure "api image migration cleanup boolean validation" "CLEAN_IMAGE must be true or false" \
  env SMOKE_DRY_RUN=true RUN_ID=self-test CLEAN_IMAGE=maybe "$API_IMAGE_MIGRATION_CHECK"
expect_failure "api image migration DB path validation" "CONTAINER_DB_PATH must be an absolute path inside the API container" \
  env SMOKE_DRY_RUN=true RUN_ID=self-test CONTAINER_DB_PATH=relative.db "$API_IMAGE_MIGRATION_CHECK"
full_lab_help_output="$(expect_success "full lab verifier help" "$FULL_LABS_VERIFY" --help)"
grep -q "Usage:" <<<"$full_lab_help_output" || fail "full lab verifier help did not print usage"
fast_lab_list_output="$(expect_success "lab runner fast list" env PLATFORM_LAB_SKIP_CONTRACT=true "$ROOT/labs/platform-academy/run-lab.sh" list)"
grep -q "trace-service-to-pod" <<<"$fast_lab_list_output" || fail "lab runner fast list did not print full labs"
expect_failure "lab runner skip-contract boolean validation" "PLATFORM_LAB_SKIP_CONTRACT must be true or false" \
  env PLATFORM_LAB_SKIP_CONTRACT=maybe "$ROOT/labs/platform-academy/run-lab.sh" list
expect_failure "full lab verifier option validation" "unsupported option" \
  "$FULL_LABS_VERIFY" --cluser
expect_failure "full lab verifier extra argument validation" "too many arguments" \
  "$FULL_LABS_VERIFY" --cluster extra

echo "Verified smoke helper dry-run and input validation."
