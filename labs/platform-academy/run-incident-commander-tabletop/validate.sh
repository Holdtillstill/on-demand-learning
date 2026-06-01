#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/run-incident-commander-tabletop"
SIGNALS="$LAB_DIR/signals.md"
ROLES="$LAB_DIR/roles.md"
TIMELINE="$LAB_DIR/timeline.md"
BRIEF="$LAB_DIR/commander-brief.md"
DONE="$LAB_DIR/completed-timeline.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/incident_tabletop_analyzer.py"
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

grep -q "SEV-2 declared" "$SIGNALS" || fail "signals.md should include SEV-2"
grep -q "rollback option identified: revision 42" "$SIGNALS" || fail "signals.md should include rollback option"
grep -q "Next stakeholder update due in 15 minutes" "$SIGNALS" || fail "signals.md should include update deadline"
grep -q "Incident commander" "$ROLES" || fail "roles.md should include incident commander"
grep -q "Communications lead" "$ROLES" || fail "roles.md should include communications lead"
grep -q "Declare SEV-2" "$TIMELINE" || fail "timeline.md should include SEV-2 timeline entry"
grep -q "Rollback revision 43" "$BRIEF" || fail "commander-brief.md should define mitigation decision"
grep -q "Communications drafts update" "$DONE" || fail "completed-timeline.md should include communications update"
grep -q "## Impact And Severity Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for impact and severity evidence"
grep -q "## Role Assignment Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for role assignment evidence"
grep -q "## Timeline And Handoff" "$TEMPLATE" || fail "evidence-template.md should prompt for timeline and handoff evidence"
grep -q "Incident commander tabletop analysis passed" "$ANALYZER" || fail "incident_tabletop_analyzer.py should report successful analysis"
python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-incident --format metrics --events 2 >/dev/null
python3 "$ANALYZER" --signals "$SIGNALS" --roles "$ROLES" --timeline "$TIMELINE" --brief "$BRIEF" --completed-timeline "$DONE" --quiet

echo "File checks passed for run-incident-commander-tabletop."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "SEV-2 severity" "SEV-2"
  require_evidence_match "$evidence_file" "checkout error-rate impact" "0\\.2%|9\\.4%|checkout 5xx|payment confirmation"
  require_evidence_match "$evidence_file" "suspect rollout revision 43" "revision 43|rev 43|promoted to 100%"
  require_evidence_match "$evidence_file" "rollback option revision 42" "revision 42|rollback"
  require_evidence_match "$evidence_file" "incident role assignment" "Incident commander|Operations|Communications|Planning"
  require_evidence_match "$evidence_file" "stakeholder update clock" "15 minutes|stakeholder update|update clock"
  require_evidence_match "$evidence_file" "timeline and owner handoff" "timeline|handoff|owner|decision"
  require_evidence_match "$evidence_file" "local incident analyzer evidence" "Incident commander tabletop analysis passed|incident tabletop analyzer|tabletop analysis"
  require_evidence_match "$evidence_file" "no-live tabletop boundary or cleanup" "no live|tabletop|cleanup|no cleanup"
  echo "Evidence checks passed for run-incident-commander-tabletop."
fi
