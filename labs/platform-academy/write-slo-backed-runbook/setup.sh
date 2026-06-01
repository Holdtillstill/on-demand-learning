#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/write-slo-backed-runbook"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/slo_runbook_analyzer.py"

evidence_file="/tmp/slo-runbook-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/write-slo-backed-runbook/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage SLO runbook artifacts. This is the default.
  --run-analyzer   Run the captured SLO runbook analyzer after staging evidence.
  --evidence       Evidence note path to create when it does not already exist.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cluster|--transcript)
      ;;
    --run-analyzer)
      run_analyzer=true
      ;;
    --evidence)
      shift
      [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
      evidence_file="$1"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      fail "unsupported option: $1"
      ;;
  esac
  shift
done

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
echo "Staged SLO runbook review bundle:"
echo "  sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/signals.md"
echo "  sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml"
echo "  sed -n '1,220p' labs/platform-academy/write-slo-backed-runbook/runbook-template.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --signals "$LAB_DIR/signals.md" \
    --rule "$LAB_DIR/prometheus-rule.yaml" \
    --runbook "$LAB_DIR/completed-runbook.md" \
    --decision "$LAB_DIR/incident-decision.md"
else
  echo "Analyzer is intentionally not run by default; inspect burn rate, symptoms, mitigation, validation, rollback, and follow-up evidence first, then run:"
  echo "  python3 labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py \\"
  echo "    --signals labs/platform-academy/write-slo-backed-runbook/signals.md \\"
  echo "    --rule labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml \\"
  echo "    --runbook labs/platform-academy/write-slo-backed-runbook/completed-runbook.md \\"
  echo "    --decision labs/platform-academy/write-slo-backed-runbook/incident-decision.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/write-slo-backed-runbook/validate.sh --evidence $evidence_file"
