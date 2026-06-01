#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-docker-image-supply-chain"
UNSAFE="$LAB_DIR/Dockerfile"
INSPECT="$LAB_DIR/image-inspect.json"
HISTORY="$LAB_DIR/history.txt"
SAFE="$LAB_DIR/hardened.Dockerfile"
PROMOTION="$LAB_DIR/promotion-note.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

evidence_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --evidence)
      shift
      [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
      evidence_file="$1"
      ;;
    *)
      fail "unsupported option: $1"
      ;;
  esac
  shift
done

grep -q "FROM node:22 AS build" "$UNSAFE" || fail "Dockerfile should include the starting build stage"
grep -q "ENV API_TOKEN=do-not-bake-secrets" "$UNSAFE" || fail "Dockerfile should expose the baked secret risk"
grep -q "COPY --from=build /app ." "$UNSAFE" || fail "Dockerfile should copy too much into runtime"
! grep -q "^USER " "$UNSAFE" || fail "Dockerfile should not already set a runtime user"

grep -q '"RepoTags": \["checkout:latest"\]' "$INSPECT" || fail "image-inspect.json should show latest tag promotion"
grep -q '"RepoDigests": \[\]' "$INSPECT" || fail "image-inspect.json should show missing digest evidence"
grep -q '"User": ""' "$INSPECT" || fail "image-inspect.json should show blank runtime user"
grep -q "API_TOKEN=do-not-bake-secrets" "$INSPECT" || fail "image-inspect.json should expose secret metadata"
grep -q "API_TOKEN=do-not-bake-secrets" "$HISTORY" || fail "history.txt should expose secret history"

grep -q "FROM node:22-bookworm-slim AS deps" "$SAFE" || fail "hardened.Dockerfile should use a smaller dependency stage"
grep -q "npm ci --omit=dev" "$SAFE" || fail "hardened.Dockerfile should install production dependencies only"
grep -q "COPY --from=build --chown=node:node /app/dist ./dist" "$SAFE" || fail "hardened.Dockerfile should copy built output with ownership"
grep -q "^USER node" "$SAFE" || fail "hardened.Dockerfile should run as node"
grep -q 'CMD \["node", "dist/server.js"\]' "$SAFE" || fail "hardened.Dockerfile should start the built server directly"
! grep -q "API_TOKEN" "$SAFE" || fail "hardened.Dockerfile should not contain secrets"

grep -q "Block promotion of .checkout:latest." "$PROMOTION" || fail "promotion-note.md should block latest promotion"
grep -q "Immutable image digest" "$PROMOTION" || fail "promotion-note.md should require digest evidence"
grep -q "SBOM artifact" "$PROMOTION" || fail "promotion-note.md should require SBOM evidence"
grep -q "Rollback digest" "$PROMOTION" || fail "promotion-note.md should require rollback evidence"
grep -q "## Tag, Digest, And Promotion Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for promotion evidence"
grep -q "## Secret And Runtime Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for secret/runtime evidence"
grep -q "## Release Handoff" "$TEMPLATE" || fail "evidence-template.md should prompt for release handoff evidence"

echo "File checks passed for review-docker-image-supply-chain."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "latest tag without digest" "checkout:latest|RepoTags|RepoDigests|immutable digest"
  require_evidence_match "$evidence_file" "secret baked into image metadata" "API_TOKEN=do-not-bake-secrets|secret|Dockerfile|history"
  require_evidence_match "$evidence_file" "blank or root runtime user" "runtime user|User.*blank|non-root|USER node"
  require_evidence_match "$evidence_file" "runtime copies too much source" "COPY --from=build /app|copies too much|source tree"
  require_evidence_match "$evidence_file" "hardened Dockerfile target" "hardened.Dockerfile|npm ci --omit=dev|USER node|dist/server.js"
  require_evidence_match "$evidence_file" "promotion block decision" "Block promotion|block|do not promote"
  require_evidence_match "$evidence_file" "SBOM scan and rollback digest" "SBOM|scan|rollback digest|promotion-note"
  require_evidence_match "$evidence_file" "validation or cleanup evidence" "validation|validate|cleanup|file-review"
  echo "Evidence checks passed for review-docker-image-supply-chain."
fi
