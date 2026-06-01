#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/validate-helm-release-artifact"
BEFORE="$LAB_DIR/rendered-before.yaml"
AFTER="$LAB_DIR/rendered-after.yaml"
SAFE="$LAB_DIR/safe-rendered-after.yaml"
NOTES="$LAB_DIR/review-notes.md"
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

grep -q "app.kubernetes.io/name: checkout" "$BEFORE" || fail "rendered-before.yaml should use the stable app.kubernetes.io/name selector"
grep -q "registry.example.com/checkout@sha256:1111" "$BEFORE" || fail "rendered-before.yaml should start with a digest-pinned image"
grep -q "app: checkout" "$AFTER" || fail "rendered-after.yaml should contain the unsafe selector change"
grep -q "registry.example.com/checkout:latest" "$AFTER" || fail "rendered-after.yaml should contain the mutable latest image"
grep -q "privileged: true" "$AFTER" || fail "rendered-after.yaml should include the privileged regression"
grep -q "type: LoadBalancer" "$AFTER" || fail "rendered-after.yaml should include the exposure regression"
grep -q "Block the release" "$NOTES" || fail "review-notes.md should include the expected block decision"
grep -q "app.kubernetes.io/name: checkout" "$SAFE" || fail "safe-rendered-after.yaml should keep the stable selector"
grep -q "registry.example.com/checkout@sha256:2222" "$SAFE" || fail "safe-rendered-after.yaml should use a digest-pinned promoted image"
grep -q "allowPrivilegeEscalation: false" "$SAFE" || fail "safe-rendered-after.yaml should prevent privilege escalation"
grep -q "type: ClusterIP" "$SAFE" || fail "safe-rendered-after.yaml should avoid new external exposure"
! grep -q "privileged: true" "$SAFE" || fail "safe-rendered-after.yaml should not be privileged"
! grep -q "checkout:latest" "$SAFE" || fail "safe-rendered-after.yaml should not use latest"
grep -q "## Immutable Selector Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for selector evidence"
grep -q "## Image, Security, And Exposure Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for image/security/exposure evidence"
grep -q "## Safer Render Validation" "$TEMPLATE" || fail "evidence-template.md should prompt for safer render validation"

echo "File checks passed for validate-helm-release-artifact."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "rendered artifact and no-apply boundary" "rendered-after|rendered-before|unsafe render|not applied"
  require_evidence_match "$evidence_file" "immutable selector change" "immutable|selector|app.kubernetes.io/name|app=checkout"
  require_evidence_match "$evidence_file" "mutable latest image" "checkout:latest|latest|digest-pinned|sha256"
  require_evidence_match "$evidence_file" "privileged runtime regression" "privileged|non-privileged|security context"
  require_evidence_match "$evidence_file" "LoadBalancer exposure risk" "LoadBalancer|ClusterIP|exposure|public"
  require_evidence_match "$evidence_file" "block release decision" "block|blocked|do not approve|release decision"
  require_evidence_match "$evidence_file" "safer render target" "safe-rendered-after|digest|ClusterIP|allowPrivilegeEscalation: false|non-root"
  require_evidence_match "$evidence_file" "validation or cleanup evidence" "validation|validate|cleanup|file-review"
  echo "Evidence checks passed for validate-helm-release-artifact."
fi
