#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/create-platform-golden-path"
START="$LAB_DIR/service-template.md"
CATALOG="$LAB_DIR/catalog-info.yaml"
READY="$LAB_DIR/ready-service-template.md"
FIXED="$LAB_DIR/fixed-catalog-info.yaml"
DECISION="$LAB_DIR/decision-record.md"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/golden_path_analyzer.py"
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

grep -q "Generated artifacts" "$START" || fail "service-template.md should list generated artifacts"
grep -q "Dockerfile" "$START" || fail "service-template.md should include Dockerfile output"
grep -q "SLO dashboard" "$START" || fail "service-template.md should include dashboard output"
grep -q "Runbook" "$START" || fail "service-template.md should include runbook output"
grep -q "Backstage catalog-info.yaml" "$START" || fail "service-template.md should include catalog metadata output"
grep -q "pagerduty.com/service-id: missing" "$CATALOG" || fail "catalog-info.yaml should expose missing pager ownership"
grep -q "platform.example.com/slo-dashboard: missing" "$CATALOG" || fail "catalog-info.yaml should expose missing dashboard ownership"

grep -q "Required Inputs" "$READY" || fail "ready-service-template.md should define required inputs"
grep -q "data_classification" "$READY" || fail "ready-service-template.md should require data classification"
grep -q "pager_rotation" "$READY" || fail "ready-service-template.md should require pager rotation"
grep -q "cost_center" "$READY" || fail "ready-service-template.md should require cost center"
grep -q "Run as non-root" "$READY" || fail "ready-service-template.md should include secure runtime defaults"
grep -q "Production readiness review" "$READY" || fail "ready-service-template.md should include production readiness review"
grep -q "Adoption Metrics" "$READY" || fail "ready-service-template.md should define adoption metrics"

grep -q "pagerduty.com/service-id: P123CHECKOUT" "$FIXED" || fail "fixed-catalog-info.yaml should include a concrete pager id"
grep -q "platform.example.com/slo-dashboard: https://grafana.example.com/d/checkout-slo" "$FIXED" || fail "fixed-catalog-info.yaml should include a concrete dashboard"
grep -q "platform.example.com/runbook:" "$FIXED" || fail "fixed-catalog-info.yaml should include a runbook link"
grep -q "owner: group:payments" "$FIXED" || fail "fixed-catalog-info.yaml should use a concrete owner"
! grep -q "missing" "$FIXED" || fail "fixed-catalog-info.yaml should not leave missing placeholders"

grep -q "Block the starting service template" "$DECISION" || fail "decision-record.md should document the block decision"
grep -q "Adoption metrics" "$DECISION" || fail "decision-record.md should mention adoption metrics"
grep -q "Golden path readiness analysis passed" "$ANALYZER" || fail "golden_path_analyzer.py should report a successful local analysis"

grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "generates many files" "$TRIAGE" || fail "triage-notes.md should reject generated-files-only readiness"
grep -q "Backstage catalog presence is not ownership proof" "$TRIAGE" || fail "triage-notes.md should reject catalog-only ownership"
grep -q "A smooth first run is not enough" "$TRIAGE" || fail "triage-notes.md should reject first-run-only readiness"
grep -q "Optional metadata becomes operational debt" "$TRIAGE" || fail "triage-notes.md should reject optional ownership metadata"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage false leads"
grep -q "## Template Contract Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for template contract evidence"
grep -q "## Ownership Metadata Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for ownership metadata evidence"
grep -q "## Product Decision Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for product decision evidence"

python3 "$ANALYZER" \
  --start-template "$START" \
  --ready-template "$READY" \
  --catalog "$CATALOG" \
  --fixed-catalog "$FIXED" \
  --decision "$DECISION" \
  --quiet

echo "File checks passed for create-platform-golden-path."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|False Leads|generated files|catalog presence|smooth first run|optional metadata"
  require_evidence_match "$evidence_file" "generated artifact contract" "Generated artifacts|Dockerfile|SLO dashboard|Runbook|catalog-info"
  require_evidence_match "$evidence_file" "required inputs" "Required Inputs|data_classification|pager_rotation|cost_center"
  require_evidence_match "$evidence_file" "missing pager or dashboard metadata" "pagerduty.com/service-id: missing|slo-dashboard: missing|missing"
  require_evidence_match "$evidence_file" "secure runtime defaults or launch gates" "Run as non-root|secure runtime|Production readiness review|launch gates"
  require_evidence_match "$evidence_file" "fixed ownership metadata" "P123CHECKOUT|grafana.example.com/d/checkout-slo|group:payments|runbook"
  require_evidence_match "$evidence_file" "local golden path analyzer evidence" "Golden path readiness analysis passed|golden-path analyzer|Fixed metadata|Starting gap"
  require_evidence_match "$evidence_file" "block incomplete template decision" "Block the starting service template|block|incomplete"
  require_evidence_match "$evidence_file" "adoption or reliability metrics" "Adoption metrics|reliability metrics|validation"
  require_evidence_match "$evidence_file" "no-runtime or cleanup note" "no-runtime|cleanup|no cleanup|validation"
  echo "Evidence checks passed for create-platform-golden-path."
fi
