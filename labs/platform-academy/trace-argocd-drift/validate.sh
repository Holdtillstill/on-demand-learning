#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-argocd-drift"
DESIRED="$LAB_DIR/desired.yaml"
LIVE="$LAB_DIR/live.yaml"
REPORT="$LAB_DIR/argocd-app-report.txt"
DECISION="$LAB_DIR/ownership-decision.md"
IGNORE="$LAB_DIR/ignore-differences.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/drift_analyzer.py"
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

  "$python_bin" "$checker" --lab trace-argocd-drift
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

grep -q "replicas: 3" "$DESIRED" || fail "desired.yaml should declare three replicas"
grep -q "replicas: 9" "$LIVE" || fail "live.yaml should show autoscaled replicas"
grep -q "Sync Status:        OutOfSync" "$REPORT" || fail "argocd-app-report.txt should include OutOfSync status"
grep -q "field: /spec/replicas" "$REPORT" || fail "argocd-app-report.txt should name /spec/replicas"
grep -q "selfHeal: true" "$REPORT" || fail "argocd-app-report.txt should include selfHeal risk"
grep -q "Do not force sync" "$REPORT" || fail "argocd-app-report.txt should include force-sync safety guidance"
grep -q "autoscaling.platform.example.com/last-scale" "$LIVE" || fail "live.yaml should include autoscaling ownership evidence"
grep -q "spec.replicas" "$DECISION" || fail "ownership-decision.md should name spec.replicas"
grep -q "ignoreDifferences:" "$IGNORE" || fail "ignore-differences.yaml should define ignoreDifferences"
grep -q "name: checkout" "$IGNORE" || fail "ignore-differences.yaml should scope to checkout"
grep -q "namespace: payments" "$IGNORE" || fail "ignore-differences.yaml should scope to payments"
grep -q -- "- /spec/replicas" "$IGNORE" || fail "ignore-differences.yaml should ignore only /spec/replicas"
! grep -q "jqPathExpressions" "$IGNORE" || fail "ignore-differences.yaml should stay narrow and explicit"
grep -q "## Drift Field Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for drift field evidence"
grep -q "## Ownership Decision" "$TEMPLATE" || fail "evidence-template.md should prompt for ownership decision"
grep -q "## Ignore Rule Review" "$TEMPLATE" || fail "evidence-template.md should prompt for ignore rule review"
grep -q "ArgoCD drift analysis passed" "$ANALYZER" || fail "drift_analyzer.py should report a successful local drift analysis"

python3 "$ANALYZER" \
  --desired "$DESIRED" \
  --live "$LIVE" \
  --ignore-rule "$IGNORE" \
  --report "$REPORT" \
  --quiet

run_structural_check
echo "File checks passed for trace-argocd-drift."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "ArgoCD app report" "argocd-app-report\\.txt|OutOfSync|Sync Status|Health Status"
  require_evidence_match "$evidence_file" "desired and live replica drift" "replicas: 3|replicas: 9|desired|live"
  require_evidence_match "$evidence_file" "replicas field path" "/spec/replicas|spec.replicas"
  require_evidence_match "$evidence_file" "selfHeal force-sync risk" "selfHeal|force sync|force-sync|fight"
  require_evidence_match "$evidence_file" "autoscaler ownership signal" "autoscaling|last-scale|autoscaler|HPA"
  require_evidence_match "$evidence_file" "narrow ignore rule scope" "ignoreDifferences|checkout|payments|/spec/replicas"
  require_evidence_match "$evidence_file" "Git-owned fields protected" "Git-owned|image|labels|resources|probes|security"
  require_evidence_match "$evidence_file" "local drift analyzer evidence" "drift analyzer|drift analysis|ArgoCD drift analysis passed|Git-owned image"
  require_evidence_match "$evidence_file" "broad ignore rejected" "full-object ignore|broad ignore|unsafe|not ignore"
  require_evidence_match "$evidence_file" "validation or handoff evidence" "validation|validate|handoff|owner|cleanup"
  echo "Evidence checks passed for trace-argocd-drift."
fi
