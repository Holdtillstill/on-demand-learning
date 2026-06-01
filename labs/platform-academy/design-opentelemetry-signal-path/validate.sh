#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-opentelemetry-signal-path"
COLLECTOR="$LAB_DIR/collector.yaml"
LOGS="$LAB_DIR/checkout-logs.txt"
RULE="$LAB_DIR/prometheus-rule.yaml"
SAFE="$LAB_DIR/safe-prometheus-rule.yaml"
DECISION="$LAB_DIR/signal-path-decision.md"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/signal_path_analyzer.py"
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

grep -q "http.request.header.authorization" "$COLLECTOR" || fail "collector.yaml should delete authorization header"
grep -q "action: delete" "$COLLECTOR" || fail "collector.yaml should include delete action"
grep -q "trace_id=missing" "$LOGS" || fail "checkout-logs.txt should expose missing trace context"
grep -q "customer_email" "$RULE" || fail "prometheus-rule.yaml should expose cardinality risk"
grep -q "sum by (le, route)" "$SAFE" || fail "safe-prometheus-rule.yaml should aggregate by route only"
! grep -q "customer_email" "$SAFE" || fail "safe-prometheus-rule.yaml should remove customer email"
grep -q "Owner Map" "$DECISION" || fail "signal-path-decision.md should include owner map"
grep -q "App owner: propagate trace context" "$DECISION" || fail "signal-path-decision.md should include app owner"
grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "Dropping authorization headers does not prove" "$TRIAGE" || fail "triage-notes.md should reject header-deletion-only confidence"
grep -q "One valid trace ID does not make" "$TRIAGE" || fail "triage-notes.md should reject one-good-trace confidence"
grep -q "Customer-level alert grouping" "$TRIAGE" || fail "triage-notes.md should reject customer-level grouping"
grep -q "A simulator sample does not replace an owner map" "$TRIAGE" || fail "triage-notes.md should require owner map"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage false leads"
grep -q "## Sensitive Attribute Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for sensitive attribute evidence"
grep -q "## Trace Context Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for trace context evidence"
grep -q "## Metric Cardinality Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for metric cardinality evidence"
grep -q "OpenTelemetry signal path analysis passed" "$ANALYZER" || fail "signal_path_analyzer.py should report successful analysis"
python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-latency --format metrics --events 2 >/dev/null
python3 "$ANALYZER" --collector "$COLLECTOR" --logs "$LOGS" --rule "$RULE" --safe-rule "$SAFE" --decision "$DECISION" --quiet

echo "File checks passed for design-opentelemetry-signal-path."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|False Leads|header deletion|one valid trace|customer-level|simulator sample|owner map"
  require_evidence_match "$evidence_file" "authorization header deletion" "http.request.header.authorization|authorization header|action: delete"
  require_evidence_match "$evidence_file" "missing trace context" "trace_id=missing|missing trace"
  require_evidence_match "$evidence_file" "customer_email cardinality risk" "customer_email|high-cardinality|cardinality|sensitive"
  require_evidence_match "$evidence_file" "safer route-only aggregation" "sum by \\(le, route\\)|route only|safe-prometheus-rule"
  require_evidence_match "$evidence_file" "app instrumentation owner" "App owner|app instrumentation|propagate trace context"
  require_evidence_match "$evidence_file" "telemetry and privacy owner split" "collector|telemetry/platform|SRE alert|privacy|owner map"
  require_evidence_match "$evidence_file" "local signal path analyzer evidence" "OpenTelemetry signal path analysis passed|signal-path analyzer|signal path analysis"
  require_evidence_match "$evidence_file" "simulator or validation evidence" "simulator|validation|validate|metrics|cleanup|no live"
  echo "Evidence checks passed for design-opentelemetry-signal-path."
fi
