#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/write-slo-backed-runbook"
SIGNALS="$LAB_DIR/signals.md"
RULE="$LAB_DIR/prometheus-rule.yaml"
TEMPLATE="$LAB_DIR/runbook-template.md"
RUNBOOK="$LAB_DIR/completed-runbook.md"
DECISION="$LAB_DIR/incident-decision.md"
EVIDENCE_TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/slo_runbook_analyzer.py"
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

  "$python_bin" "$checker" --lab write-slo-backed-runbook
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

grep -q "Availability: 99.9%" "$SIGNALS" || fail "signals.md should include the SLO target"
grep -q "CheckoutHighErrorBudgetBurn firing for 14 minutes" "$SIGNALS" || fail "signals.md should include alert duration"
grep -q "43        checkout@sha256:bbbb canary 100%" "$SIGNALS" || fail "signals.md should include revision 43"
grep -q "pods readiness flapping" "$SIGNALS" || fail "signals.md should include readiness symptom"
grep -q "target group unhealthy threshold crossed" "$SIGNALS" || fail "signals.md should include target-health symptom"

grep -q "CheckoutHighErrorBudgetBurn" "$RULE" || fail "prometheus-rule.yaml should define the burn alert"
grep -q "> 0.02" "$RULE" || fail "prometheus-rule.yaml should define 2 percent threshold"
grep -q "for: 10m" "$RULE" || fail "prometheus-rule.yaml should define alert duration"
grep -q "dashboard:" "$RULE" || fail "prometheus-rule.yaml should link dashboard"

grep -q "Safe First Commands" "$TEMPLATE" || fail "runbook-template.md should require safe first commands"
grep -q "corrective actions" "$TEMPLATE" || fail "runbook-template.md should require follow-up ownership"

grep -q "Users may see failed or delayed checkout attempts" "$RUNBOOK" || fail "completed-runbook.md should state user impact"
grep -q "kubectl rollout history deploy/checkout -n payments" "$RUNBOOK" || fail "completed-runbook.md should include read-only rollout evidence"
grep -q "kubectl rollout undo deploy/checkout -n payments --to-revision=42" "$RUNBOOK" || fail "completed-runbook.md should include approved rollback command"
grep -q "5xx ratio falls below 2%" "$RUNBOOK" || fail "completed-runbook.md should include validation criteria"
grep -q "Platform owner: add dashboard panel" "$RUNBOOK" || fail "completed-runbook.md should include follow-up owner"

grep -q "Collect read-only evidence first" "$DECISION" || fail "incident-decision.md should state evidence-first decision"
grep -q "Owner Split" "$DECISION" || fail "incident-decision.md should include owner split"
grep -q "SLO runbook analysis passed" "$ANALYZER" || fail "slo_runbook_analyzer.py should report a successful local analysis"
grep -q "## SLO And Alert Evidence" "$EVIDENCE_TEMPLATE" || fail "evidence-template.md should prompt for SLO and alert evidence"
grep -q "## Rollout And Symptom Evidence" "$EVIDENCE_TEMPLATE" || fail "evidence-template.md should prompt for rollout and symptom evidence"
grep -q "## Mitigation Decision" "$EVIDENCE_TEMPLATE" || fail "evidence-template.md should prompt for mitigation decision"

python3 "$ANALYZER" \
  --signals "$SIGNALS" \
  --rule "$RULE" \
  --runbook "$RUNBOOK" \
  --decision "$DECISION" \
  --quiet

run_structural_check
echo "File checks passed for write-slo-backed-runbook."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "SLO target" "99\\.9%|availability SLO|SLO"
  require_evidence_match "$evidence_file" "burn alert and threshold" "CheckoutHighErrorBudgetBurn|0\\.02|2%|burn"
  require_evidence_match "$evidence_file" "alert duration" "14 minutes|10m|10 minutes|duration"
  require_evidence_match "$evidence_file" "suspect rollout revision" "revision 43|rev 43|checkout@sha256:bbbb"
  require_evidence_match "$evidence_file" "readiness or target-health symptom" "readiness flapping|target-health|target group unhealthy|pods readiness"
  require_evidence_match "$evidence_file" "evidence-first safe commands" "read-only|safe first|rollout history|events|logs|evidence first"
  require_evidence_match "$evidence_file" "mitigation or rollback criteria" "rollback|revision 42|traffic-shift|mitigation|escalation"
  require_evidence_match "$evidence_file" "local SLO runbook analyzer evidence" "SLO runbook analysis passed|SLO runbook analyzer|Safe first commands|Mitigation boundary"
  require_evidence_match "$evidence_file" "validation and follow-up ownership" "validation|5xx|follow-up|owner|dashboard|alert improvement"
  echo "Evidence checks passed for write-slo-backed-runbook."
fi
