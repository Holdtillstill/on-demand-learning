#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -n "${PYTHON:-}" ]; then
  PYTHON_BIN="${PYTHON}"
elif command -v python3.11 >/dev/null 2>&1; then
  PYTHON_BIN="python3.11"
else
  PYTHON_BIN="python3"
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

count_py_tests() {
  if [ ! -d "${1:-}" ]; then
    printf '0'
    return
  fi

  find "$1" -name 'test_*.py' -type f -exec grep -hE '^[[:space:]]*(async[[:space:]]+)?def test_' {} + 2>/dev/null | wc -l | tr -d ' '
}

generated_artifacts="$(
  cd "$ROOT"
  find . \( -name '.git' -o -name 'node_modules' -o -name '.venv' \) -prune -o \
    \( -path './apps/platform-academy/dist' -o -path './smoke-artifacts' \
      -o -path './infra/terraform/.terraform' \
      -o -name '.pytest_cache' -o -name '__pycache__' -o -name '*.tsbuildinfo' \
      -o -name 'test.db' -o -name 'ci-test.db' -o -name 'ci-smoke.db' -o -name 'ci-platform-browser-smoke.db' \
      -o -name 'playwright-report' -o -name 'test-results' -o -name 'coverage' \) \
    -print
)"

docker_state="available"
smoke_images=""
smoke_containers=""
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  smoke_images="$(docker images --format '{{.Repository}}:{{.Tag}} {{.ID}}' | grep -E '^(on-demand-platform-smoke-|on-demand-api-release-check:)' || true)"
  smoke_containers="$(docker ps -a --format '{{.Names}} {{.Image}}' | grep -E '^on-demand-platform-smoke-' || true)"
else
  docker_state="unavailable"
fi

branch="$(git_value rev-parse --abbrev-ref HEAD)"
commit="$(git_value rev-parse --short=12 HEAD)"
status="$(git_value status --short --untracked-files=all)"
review_base="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --base-info)"
review_changed_paths="$(PYTHONDONTWRITEBYTECODE=1 "$PYTHON_BIN" "$ROOT/scripts/platform_review_manifest.py" --list-paths)"
review_changed_count="$(count_lines "$review_changed_paths")"
local_changed_count="$(count_lines "$status")"
generated_count="$(count_lines "$generated_artifacts")"
image_count="$(count_lines "$smoke_images")"
container_count="$(count_lines "$smoke_containers")"
api_test_count="$(count_py_tests "$ROOT/apps/api")"
worker_test_count="$(count_py_tests "$ROOT/apps/worker")"
generated_at="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"

cat <<EOF
# Platform Academy Release Evidence

Generated: ${generated_at}
Branch: ${branch:-unknown}
Commit: ${commit:-unknown}
Review base: ${review_base}
Review changed paths: ${review_changed_count}
Working tree changed paths: ${local_changed_count}

## Required Local Evidence

- [ ] \`make release-check\`
- [ ] \`make platform-release-check\`
- [ ] \`make working-tree-hygiene-check\`
- [ ] \`make terraform-validate\`
- [ ] \`make clean-generated clean-smoke-images\`
- [ ] \`git diff --check\`

Paste the most recent successful \`make platform-release-check\` tail here:

\`\`\`text
<paste output showing API tests, frontend tests/builds, 21 full labs, API image migrations, source/workspace bundle smoke, browser smoke, and API log audit>
\`\`\`

## Verified Release Scope

- API tests: ${api_test_count} expected.
- Worker tests: ${worker_test_count} expected.
- Platform Academy frontend tests: 34 expected.
- Full labs: 21 expected.
- API smoke: catalog/resource/interview counts, no-store headers, OpenAPI backup/workbook/download contract, source-bundle token header contract, learner state export/import, achievements, and product metrics.
- Browser smoke: 21 courses, 84 lessons, 21 lab detail routes, 21 portfolio-grade UI signals, 320 resource detail routes, 22 interview prep packs, desktop and mobile route checks.
- Lab smoke: all lab packets, protected instructor/source bundles, learner workspace bundles, no-store download headers, safe source/workspace extraction, source helper syntax, and each workspace \`validate.sh --files-only\`.
- API image migration smoke: \`alembic upgrade head\`, \`alembic current\`, \`alembic check\`, and bundled lab verifier with \`CREATE_SCHEMA_ON_STARTUP=false\`.
- Terraform scaffold: \`terraform fmt -check\`, \`terraform init -backend=false\`, and \`terraform validate\` through \`make terraform-validate\`.
- Review scope: branch-aware manifest and review pack compare against the review base and include local modified, staged, or untracked files.
- Working-tree hygiene: committed branch changes plus local modified, staged, and untracked files are checked for generated artifacts, executable shell helpers, trailing whitespace, CRLF line endings, conflict markers, and missing final newlines.
- Workflow contract: expected GitHub Actions workflow set, Platform Academy image path filters, migration/scan/container-smoke-before-push ordering, backend API smoke, frontend browser smoke, deployed smoke origin/token/skip wiring, and platform validation gates.

## Cleanup Status

- Generated artifacts: ${generated_count} found.
- Temporary smoke images: ${image_count} found.
- Temporary smoke containers: ${container_count} found.
- Docker availability during evidence collection: ${docker_state}.

EOF

if [ -n "$generated_artifacts" ]; then
  cat <<EOF
Generated artifacts still present:

\`\`\`text
${generated_artifacts}
\`\`\`

EOF
fi

if [ -n "$smoke_images" ]; then
  cat <<EOF
Temporary smoke images still present:

\`\`\`text
${smoke_images}
\`\`\`

EOF
fi

if [ -n "$smoke_containers" ]; then
  cat <<EOF
Temporary smoke containers still present:

\`\`\`text
${smoke_containers}
\`\`\`

EOF
fi

cat <<'EOF'
## Deployment Fill-Ins

- API image tag:
- Platform Academy web image tag:
- Alembic revision from target DB:
- Backup/snapshot ID:
- Rollback image tag:
- `CORS_ORIGINS`:
- `TRUSTED_PROXY_CIDRS`:
- `RATE_LIMIT_EXEMPT_PATHS`:
- `CREATE_SCHEMA_ON_STARTUP`:
- `PLATFORM_SOURCE_BUNDLE_PUBLIC` (`false` outside local/test/development):
- Protected source-bundle smoke:
- Smoke profile used:

## Reviewer Routing

- Lab product/API: `apps/api/app/platform_content.py`, `apps/api/app/platform_lab_artifacts.py`, `apps/api/app/main.py`, `apps/api/app/schemas.py`, `apps/api/tests/test_api.py`.
- Lab artifacts: `labs/platform-academy/`.
- Platform Academy UI: `apps/platform-academy/src/App.tsx`, `apps/platform-academy/src/styles.css`, `apps/platform-academy/src/api.ts`, `apps/platform-academy/src/types.ts`, `apps/platform-academy/src/App.test.tsx`.
- Release/deployment: `Makefile`, `scripts/`, `.github/workflows/`, `.env.example`, `docker-compose.yml`, `infra/k8s/platform-academy.yaml`, `docs/deployment.md`.

Branch-aware helpers honor `GITHUB_BASE_REF` in GitHub Actions and `PLATFORM_REVIEW_BASE=<ref>` for local override.

Run `make platform-lab-matrix` when reviewers need a lab-by-lab portfolio-focus, structural-gate, mode, artifact-count, evidence-check, and false-lead artifact index. Run `make platform-review-manifest` when reviewers need committed branch changes plus local modified, staged, or untracked files grouped by subsystem. Run `make platform-review-pack` when reviewers or deployment owners need one disposable bundle with the release scaffold, lab matrix, review-scope summary, changed-file manifest, commit plan with pathspec files, content-count contract, workflow contract, handoff docs, PR template, git status, and diff summaries.
EOF
