#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACK_DIR_INPUT="${PLATFORM_REVIEW_PACK_DIR:-smoke-artifacts/platform-review-pack}"

if [ -n "${PYTHON:-}" ]; then
  PYTHON_BIN="${PYTHON}"
elif command -v python3.11 >/dev/null 2>&1; then
  PYTHON_BIN="python3.11"
else
  PYTHON_BIN="python3"
fi

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

if [ "$#" -ne 0 ]; then
  fail "platform_review_pack.sh does not accept positional arguments; use PLATFORM_REVIEW_PACK_DIR=/path to override output."
fi

git_value() {
  git -C "$ROOT" "$@" 2>/dev/null || true
}

count_lines() {
  if [ -z "${1:-}" ]; then
    printf '0'
  else
    printf '%s\n' "$1" | wc -l | tr -d ' '
  fi
}

count_matching_paths() {
  local pattern="$1"
  local paths="${2:-}"
  if [ -z "$paths" ]; then
    printf '0'
  else
    printf '%s\n' "$paths" | awk -v pattern="$pattern" '$0 ~ pattern { count += 1 } END { print count + 0 }'
  fi
}

case "$PACK_DIR_INPUT" in
  /*) out_dir="$PACK_DIR_INPUT" ;;
  *) out_dir="$ROOT/$PACK_DIR_INPUT" ;;
esac

case "$out_dir" in
  "$ROOT"/smoke-artifacts/*|/tmp/on-demand-platform-review-pack-*) ;;
  *)
    fail "PLATFORM_REVIEW_PACK_DIR must be under smoke-artifacts/ or /tmp/on-demand-platform-review-pack-*"
    ;;
esac

rm -rf "$out_dir"
case "$out_dir" in
  /tmp/on-demand-platform-review-pack-*) ;;
  *) rmdir "$ROOT/smoke-artifacts" 2>/dev/null || true ;;
esac

release_evidence="$("$ROOT/scripts/platform_release_evidence.sh")"
lab_matrix="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" --lab-review-matrix)"
portfolio_artifact_contract="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_artifacts.py")"
content_count_contract="$(PYTHONPATH="$ROOT/apps/api" PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/verify_platform_content_counts.py")"
workflow_contracts="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/verify_workflow_contracts.py")"
review_manifest="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py")"
commit_plan="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --commit-plan "$out_dir")"
review_base="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --base-info)"
changed_files="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --list-paths)"
git_diffstat="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --diffstat)"
git_name_status="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --name-status)"
git_status="$(git_value status --short --branch --untracked-files=all)"
untracked_files="$(git_value ls-files --others --exclude-standard)"
local_tracked_files="$(
  {
    git_value diff --name-only
    git_value diff --cached --name-only
  } | sed '/^$/d' | sort -u
)"

branch="$(git_value rev-parse --abbrev-ref HEAD)"
commit="$(git_value rev-parse --short=12 HEAD)"
changed_count="$(count_lines "$changed_files")"
local_tracked_count="$(count_lines "$local_tracked_files")"
untracked_count="$(count_lines "$untracked_files")"
api_count="$(count_matching_paths '^(apps/api|apps/worker|infra/db)/' "$changed_files")"
ui_count="$(count_matching_paths '^apps/platform-academy/' "$changed_files")"
lab_count="$(count_matching_paths '^labs/platform-academy/' "$changed_files")"
release_count="$(count_matching_paths '^(\.env\.example$|\.gitignore$|\.github/|Makefile$|docker-compose\.yml$|infra/k8s/|scripts/)' "$changed_files")"
docs_count="$(count_matching_paths '^(README\.md$|docs/|observability/)' "$changed_files")"
other_count=$((changed_count - api_count - ui_count - lab_count - release_count - docs_count))
generated_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

mkdir -p "$out_dir"
PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --write-pathspec-dir "$out_dir"

printf '%s\n' "$release_evidence" >"$out_dir/release-evidence.md"
printf '%s\n' "$lab_matrix" >"$out_dir/lab-review-matrix.md"
printf '%s\n' "$portfolio_artifact_contract" >"$out_dir/portfolio-artifact-contract.txt"
printf '%s\n' "$content_count_contract" >"$out_dir/content-count-contract.txt"
printf '%s\n' "$workflow_contracts" >"$out_dir/workflow-contracts.txt"
printf '%s\n' "$review_manifest" >"$out_dir/changed-file-review-manifest.md"
printf '%s\n' "$commit_plan" >"$out_dir/commit-plan.md"
printf '%s\n' "$git_status" >"$out_dir/git-status.txt"
printf '%s\n' "${git_diffstat:-No branch or local tracked diffstat output.}" >"$out_dir/tracked-diffstat.txt"
printf '%s\n' "${git_name_status:-No branch or local tracked file changes.}" >"$out_dir/tracked-name-status.txt"
printf '%s\n' "${untracked_files:-No untracked files.}" >"$out_dir/untracked-files.txt"

cat >"$out_dir/review-scope.md" <<EOF
# Platform Academy Review Scope

Generated: ${generated_at}
Branch: ${branch:-unknown}
Commit: ${commit:-unknown}
Review base: ${review_base}

This branch is intentionally broad. Use this generated scope summary with \`changed-file-review-manifest.md\` and \`commit-plan.md\` to route review by subsystem before reading the full diff.

## File Counts

- Review changed files: ${changed_count}
- Local modified or staged tracked files: ${local_tracked_count}
- Local untracked files: ${untracked_count}
- API, worker, and migrations: ${api_count}
- Platform Academy frontend: ${ui_count}
- Lab source artifacts: ${lab_count}
- Release, deployment, workflow, and smoke tooling: ${release_count}
- Docs and observability: ${docs_count}
- Other paths: ${other_count}

## Suggested Review Order

1. Release/deployment contracts: \`Makefile\`, \`scripts/\`, \`.github/workflows/\`, \`.env.example\`, \`docker-compose.yml\`, and \`infra/k8s/zhongwen-platform.yaml\`.
2. API contracts and persistence: \`apps/api/app/main.py\`, \`apps/api/app/platform_content.py\`, \`apps/api/app/platform_lab_artifacts.py\`, \`apps/api/app/schemas.py\`, Alembic files, and API tests.
3. Lab artifacts: \`labs/platform-academy/\`, using \`lab-review-matrix.md\` to split portfolio-grade labs from the broader full-lab set.
4. Platform Academy frontend: \`apps/platform-academy/src/\` plus \`apps/platform-academy/scripts/smoke-routes.mjs\`.
5. Docs, runbooks, release checklist, and observability updates.

## Scope Notes

- \`git-status.txt\` is generated with \`--untracked-files=all\` so new lab evidence files and scripts are visible individually.
- \`tracked-diffstat.txt\` covers committed branch diff plus any local tracked edits; Git cannot diff untracked files until they are added.
- \`changed-file-review-manifest.md\` groups committed branch changes plus local modified, staged, and untracked files by reviewer lane.
- \`commit-plan.md\` maps each reviewer lane to a suggested commit message and generated pathspec file.
- Set \`PLATFORM_REVIEW_BASE=<ref>\` to compare the pack against a different target ref.
- \`untracked-files.txt\` is the authoritative flat list of local files that still need staging or cleanup before opening the PR.
- \`content-count-contract.txt\`, \`workflow-contracts.txt\`, and \`portfolio-artifact-contract.txt\` are generated verifier outputs, not hand-written claims.
EOF

cp "$ROOT/docs/platform-academy-handoff.md" "$out_dir/platform-academy-handoff.md"
cp "$ROOT/docs/release-checklist.md" "$out_dir/release-checklist.md"
cp "$ROOT/.github/pull_request_template.md" "$out_dir/pull-request-template.md"

cat >"$out_dir/README.md" <<EOF
# Platform Academy Review Pack

Generated: ${generated_at}
Branch: ${branch:-unknown}
Commit: ${commit:-unknown}
Review base: ${review_base}
Review changed paths: ${changed_count}

This pack is a disposable reviewer/deployment handoff bundle for the Platform Academy full-lab branch. It pulls together the evidence scaffold, lab review matrix, branch status, branch-aware diff summary, handoff note, release checklist, and PR template so reviewers do not have to hunt through the repo.

## Start Here

1. Read \`platform-academy-handoff.md\` for scope, reviewer routing, deployment coordination, and runtime contracts.
2. Use \`lab-review-matrix.md\` to split the 21 full labs by portfolio focus, structural gate, mode, track, learner files, source files, and evidence self-check coverage.
3. Check \`portfolio-artifact-contract.txt\` for the structural verifier result covering the 17 portfolio-grade labs.
4. Check \`content-count-contract.txt\` for the catalog/resource/interview count verifier result.
5. Check \`workflow-contracts.txt\` for the GitHub Actions release workflow contract verifier result.
6. Use \`review-scope.md\`, \`changed-file-review-manifest.md\`, and \`commit-plan.md\` to route subsystem review across API, frontend, labs, release tooling, docs, and deployment surfaces.
7. Paste \`release-evidence.md\` into the PR or release note, then fill in image tags, deployed smoke output, Alembic revision, backup/snapshot ID, and rollback tag.
8. Use \`git-status.txt\`, \`tracked-diffstat.txt\`, \`tracked-name-status.txt\`, and \`untracked-files.txt\` to sanity-check review scope before opening or updating the PR.

## Included Files

- \`release-evidence.md\`: copy-paste release evidence scaffold from \`make platform-release-evidence\`.
- \`lab-review-matrix.md\`: generated lab-by-lab review matrix from \`make platform-lab-matrix\`, including the portfolio-grade slice, structural artifact gate, evidence self-check, and false-lead artifact.
- \`portfolio-artifact-contract.txt\`: output from \`make platform-lab-artifact-contract\` proving the portfolio-grade structural artifact verifier passed.
- \`content-count-contract.txt\`: output from \`make platform-content-count-check\` proving smoke defaults and count-bearing docs match API content.
- \`workflow-contracts.txt\`: output from \`make workflow-contract-check\` proving the release-critical GitHub Actions workflow contracts passed.
- \`review-scope.md\`: generated subsystem counts and recommended review order for the broad branch.
- \`changed-file-review-manifest.md\`: generated changed-file manifest grouped by reviewer lane, including committed branch changes and local modified, staged, or untracked files.
- \`commit-plan.md\`: suggested commit slicing order, focused validation commands, and portable staging commands using pathspec files.
- \`pathspec-*.txt\`: exact file lists consumed by the portable staging loop in \`commit-plan.md\`.
- \`platform-academy-handoff.md\`: branch handoff, reviewer map, deployment assumptions, and API contract.
- \`release-checklist.md\`: local, container, deployed, migration, acceptance, and rollback checklist.
- \`pull-request-template.md\`: PR checklist fields to fill before review.
- \`git-status.txt\`: branch plus modified/untracked paths.
- \`tracked-diffstat.txt\`: branch-aware tracked diff size by file.
- \`tracked-name-status.txt\`: branch-aware tracked file status.
- \`untracked-files.txt\`: local untracked file list.

In GitHub Actions, branch-aware helpers prefer \`GITHUB_BASE_REF\` when it is available. Set \`PLATFORM_REVIEW_BASE=<ref>\` before running \`make platform-review-pack\` locally to compare against a target other than the default \`origin/main\` or \`main\`.

## Required Gates

For local release-candidate evidence:

\`\`\`bash
make release-check
make platform-release-check
make working-tree-hygiene-check
make clean-generated clean-smoke-images
git diff --check
\`\`\`

For deployed preview or stable release evidence:

\`\`\`bash
make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
\`\`\`

Do not use browser or lab skip flags as release evidence for the first preview. Use skip flags only after a full profile has already passed once on the target environment.

## Cleanup

The default pack path is \`smoke-artifacts/platform-review-pack\`. Remove it with:

\`\`\`bash
make clean-generated
\`\`\`
EOF

{
  echo "# File Manifest"
  echo
  for file_path in "$out_dir"/*; do
    [ -f "$file_path" ] || continue
    basename "$file_path"
  done | sort
} >"$out_dir/FILE-MANIFEST.txt"

display_dir="$out_dir"
case "$display_dir" in
  "$ROOT"/*) display_dir="${display_dir#"$ROOT"/}" ;;
esac

echo "Platform Academy review pack written to ${display_dir}"
echo "Files:"
for file_path in "$out_dir"/*; do
  [ -f "$file_path" ] || continue
  basename "$file_path"
done | sort | while read -r file_name; do
  printf -- "- %s\n" "$file_name"
done
