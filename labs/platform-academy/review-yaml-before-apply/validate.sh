#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-yaml-before-apply"
VENDOR="$LAB_DIR/vendor.yaml"
SAFE="$LAB_DIR/safe-baseline.yaml"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/manifest_risk_analyzer.py"
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

grep -q "kind: ClusterRole" "$VENDOR" || fail "vendor.yaml should include the risky ClusterRole"
grep -q 'resources: \["pods", "secrets"\]' "$VENDOR" || fail "vendor.yaml should grant secret access"
grep -q "privileged: true" "$VENDOR" || fail "vendor.yaml should include privileged mode"
grep -q "hostPath:" "$VENDOR" || fail "vendor.yaml should include a hostPath mount"
grep -q "stringData:" "$VENDOR" || fail "vendor.yaml should include a Secret stringData review point"
grep -q "allowPrivilegeEscalation: false" "$SAFE" || fail "safe-baseline.yaml should disable privilege escalation"
grep -q "readOnlyRootFilesystem: true" "$SAFE" || fail "safe-baseline.yaml should use a read-only root filesystem"
! grep -q "kind: ClusterRole" "$SAFE" || fail "safe-baseline.yaml should not include a ClusterRole"
! grep -q "hostPath:" "$SAFE" || fail "safe-baseline.yaml should not include hostPath"

grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "Client-side dry-run is not approval" "$TRIAGE" || fail "triage-notes.md should reject dry-run-only approval"
grep -q "ClusterRole can get, list, and watch" "$TRIAGE" || fail "triage-notes.md should include ClusterRole evidence"
grep -q "stringData.token" "$TRIAGE" || fail "triage-notes.md should include credential placeholder evidence"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage notes"
grep -q "## Manifest Inventory Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for manifest inventory evidence"
grep -q "## Security Blocker Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for security blocker evidence"
grep -q "## Vendor Decision Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for vendor decision evidence"
grep -q "YAML manifest risk analysis passed" "$ANALYZER" || fail "manifest_risk_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --vendor "$VENDOR" --safe "$SAFE" --quiet

echo "File checks passed for review-yaml-before-apply."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|triage notes|False Leads|false leads|dry-run-only|namespace-only"
  require_evidence_match "$evidence_file" "reviewed vendor manifest or no-live-apply boundary" "vendor\\.yaml|no-live-apply|not applied|dry-run"
  require_evidence_match "$evidence_file" "ClusterRole secret access" "ClusterRole|secrets|secret access"
  require_evidence_match "$evidence_file" "privileged container" "privileged[[:space:]]*:[[:space:]]*true|privileged"
  require_evidence_match "$evidence_file" "hostPath mount" "hostPath|host filesystem"
  require_evidence_match "$evidence_file" "credential placeholder" "stringData\\.token|stringData|token"
  require_evidence_match "$evidence_file" "local manifest risk analyzer evidence" "YAML manifest risk analysis passed|manifest risk analyzer|RBAC risk|Workload risk|Credential risk"
  require_evidence_match "$evidence_file" "block decision" "block|blocked|do not approve|not approve"
  require_evidence_match "$evidence_file" "safer baseline hardening" "safe-baseline|allowPrivilegeEscalation: false|readOnlyRootFilesystem: true|read-only root"
  require_evidence_match "$evidence_file" "vendor questions or validation evidence" "vendor|question|validation|validate|cleanup"
  echo "Evidence checks passed for review-yaml-before-apply."
fi
