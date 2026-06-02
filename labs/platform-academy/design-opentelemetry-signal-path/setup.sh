#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-opentelemetry-signal-path"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/signal_path_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/otel-signal-path-evidence.md"
mode="no-cluster"
run_analyzer=false
run_simulator=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh [--cluster] [--no-cluster] [--run-analyzer] [--run-simulator] [--evidence <file>]

Options:
  --cluster        Refuse live telemetry setup; this lab is a local Evidence review.
  --no-cluster     Copy the evidence template and stage local artifacts. This is the default.
  --run-analyzer   Run the local signal-path analyzer after staging evidence.
  --run-simulator  Emit simulated checkout latency metrics after staging evidence.
  --evidence       Evidence note path to create when it does not already exist.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      mode="cluster"
      ;;
    --no-cluster|--transcript)
      mode="no-cluster"
      ;;
    --run-analyzer)
      run_analyzer=true
      ;;
    --run-simulator)
      run_simulator=true
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

if [[ "$mode" == "cluster" ]]; then
  fail "cluster setup is intentionally unsupported; review local telemetry artifacts without changing a live backend"
fi

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
echo "Captured OpenTelemetry signal-path triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged OpenTelemetry signal evidence:"
echo "  sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/collector.yaml"
echo "  sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt"
echo "  sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml"
echo "  python3 labs/platform-academy/simulator.py --scenario checkout-latency --format both --events 5"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --collector "$LAB_DIR/collector.yaml" \
    --logs "$LAB_DIR/checkout-logs.txt" \
    --rule "$LAB_DIR/prometheus-rule.yaml" \
    --safe-rule "$LAB_DIR/safe-prometheus-rule.yaml" \
    --decision "$LAB_DIR/signal-path-decision.md"
else
  echo "Analyzer is intentionally not run by default; inspect privacy, trace, cardinality, owner, and alert evidence first, then run:"
  echo "  python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py \\"
  echo "    --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml \\"
  echo "    --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt \\"
  echo "    --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml \\"
  echo "    --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml \\"
  echo "    --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md"
fi

echo
if [[ "$run_simulator" == true ]]; then
  echo "Simulated checkout latency metrics:"
  python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-latency --format metrics --events 2
else
  echo "Simulator is intentionally not run by default; inspect the static signal path first, then run:"
  echo "  python3 labs/platform-academy/simulator.py --scenario checkout-latency --format metrics --events 2"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence $evidence_file"
