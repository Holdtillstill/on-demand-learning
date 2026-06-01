#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-network-path"
BROKEN="$LAB_DIR/ingress-service.yaml"
FIXED="$LAB_DIR/fixed-ingress-service.yaml"
EVIDENCE="$LAB_DIR/network-evidence.md"
HANDOFF="$LAB_DIR/incident-handoff.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

run_structural_check() {
  local checker="$ROOT/scripts/verify_platform_lab_artifacts.py"
  [[ -f "$checker" ]] || return 0

  local python_bin="${PYTHON:-}"
  if [[ -z "$python_bin" ]]; then
    if command -v python3.11 >/dev/null 2>&1; then
      python_bin="python3.11"
    elif command -v python3 >/dev/null 2>&1; then
      python_bin="python3"
    else
      fail "python3.11 or python3 is required for structural artifact checks"
    fi
  fi

  "$python_bin" "$checker" --lab trace-network-path
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

grep -q "HTTP/2 503" "$EVIDENCE" || fail "network evidence should include the user-facing 503"
grep -q "Target.ResponseCodeMismatch" "$EVIDENCE" || fail "network evidence should include the ALB target-health reason"
grep -q "targetPort web" "$EVIDENCE" || fail "network evidence should name the broken targetPort"
grep -q "Pager Snapshot" "$HANDOFF" || fail "incident-handoff.md should include a pager snapshot"
grep -q "Do not change DNS, ALB listener rules, or live Kubernetes objects" "$HANDOFF" || fail "incident-handoff.md should state the safety boundary"
grep -q "Target.ResponseCodeMismatch" "$HANDOFF" || fail "incident-handoff.md should include target-health evidence"
grep -q "targetPort web" "$HANDOFF" || fail "incident-handoff.md should include Service targetPort evidence"
grep -q "Owner Notes" "$HANDOFF" || fail "incident-handoff.md should include owner notes"
grep -q "targetPort: web" "$BROKEN" || fail "broken manifest should use targetPort web"
grep -q "name: http" "$BROKEN" || fail "broken manifest should expose a Pod port named http"
grep -q "targetPort: http" "$FIXED" || fail "fixed manifest should use targetPort http"
! grep -q "targetPort: web" "$FIXED" || fail "fixed manifest should not keep targetPort web"

grep -q "## Request And Edge Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for request and edge evidence"
grep -q "## Ingress, Service, And Pod Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for service and pod evidence"
grep -q "## Owner And Fix Decision" "$TEMPLATE" || fail "evidence-template.md should prompt for owner and fix decision"

run_structural_check
echo "File checks passed for trace-network-path."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "incident handoff and safety boundary" "incident-handoff\\.md|handoff|Pager|impact|no live"
  require_evidence_match "$evidence_file" "client 503 or ALB edge symptom" "HTTP/2 503|503|awselb|ALB"
  require_evidence_match "$evidence_file" "target-health reason" "Target\\.ResponseCodeMismatch|ResponseCodeMismatch|target health"
  require_evidence_match "$evidence_file" "Ingress host or backend" "checkout\\.example\\.com|Ingress|backend|checkout"
  require_evidence_match "$evidence_file" "broken Service targetPort web" "targetPort[[:space:]]*:?[[:space:]]*web|targetPort web"
  require_evidence_match "$evidence_file" "Pod port name http" "name[[:space:]]*:?[[:space:]]*http|port named http|Pod port"
  require_evidence_match "$evidence_file" "owners ruled out" "DNS owner|ALB owner|app/platform owner|owner ruled out|not DNS|not ALB"
  require_evidence_match "$evidence_file" "source manifest fix to targetPort http" "targetPort[[:space:]]*:?[[:space:]]*http|fixed-ingress-service\\.yaml|source-manifest|source manifest"
  require_evidence_match "$evidence_file" "validation or no-cluster handoff" "validate|validation|no-cluster|handoff|cleanup"
  echo "Evidence checks passed for trace-network-path."
fi
