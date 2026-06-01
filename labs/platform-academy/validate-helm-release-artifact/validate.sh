#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/validate-helm-release-artifact"
BEFORE="$LAB_DIR/rendered-before.yaml"
AFTER="$LAB_DIR/rendered-after.yaml"
SAFE="$LAB_DIR/safe-rendered-after.yaml"
NOTES="$LAB_DIR/review-notes.md"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/helm_release_analyzer.py"
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
grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "successful Helm render is not release approval" "$TRIAGE" || fail "triage-notes.md should reject render-success approval"
grep -q "immutable selector" "$TRIAGE" || fail "triage-notes.md should include immutable selector evidence"
grep -q "checkout:latest" "$TRIAGE" || fail "triage-notes.md should include mutable tag evidence"
grep -q "LoadBalancer" "$TRIAGE" || fail "triage-notes.md should include exposure evidence"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage notes"
grep -q "## Immutable Selector Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for selector evidence"
grep -q "## Image, Security, And Exposure Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for image/security/exposure evidence"
grep -q "## Safer Render Validation" "$TEMPLATE" || fail "evidence-template.md should prompt for safer render validation"
grep -q "Helm release artifact analysis passed" "$ANALYZER" || fail "helm_release_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --before "$BEFORE" --after "$AFTER" --safe "$SAFE" --notes "$NOTES" --quiet

echo "File checks passed for validate-helm-release-artifact."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|triage notes|False Leads|false leads|render-success|apply then fix"
  require_evidence_match "$evidence_file" "rendered artifact and no-apply boundary" "rendered-after|rendered-before|unsafe render|not applied"
  require_evidence_match "$evidence_file" "immutable selector change" "immutable|selector|app.kubernetes.io/name|app=checkout"
  require_evidence_match "$evidence_file" "mutable latest image" "checkout:latest|latest|digest-pinned|sha256"
  require_evidence_match "$evidence_file" "privileged runtime regression" "privileged|non-privileged|security context"
  require_evidence_match "$evidence_file" "LoadBalancer exposure risk" "LoadBalancer|ClusterIP|exposure|public"
  require_evidence_match "$evidence_file" "local Helm release analyzer evidence" "Helm release artifact analysis passed|Helm release analyzer|Selector risk|Exposure risk"
  require_evidence_match "$evidence_file" "block release decision" "block|blocked|do not approve|release decision"
  require_evidence_match "$evidence_file" "safer render target" "safe-rendered-after|digest|ClusterIP|allowPrivilegeEscalation: false|non-root"
  require_evidence_match "$evidence_file" "validation or cleanup evidence" "validation|validate|cleanup|file-review"
  echo "Evidence checks passed for validate-helm-release-artifact."
fi
