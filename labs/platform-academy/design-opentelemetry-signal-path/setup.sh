#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-opentelemetry-signal-path"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/signal_path_analyzer.py"

evidence_file="/tmp/otel-signal-path-evidence.md"
mode="no-cluster"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Refuse live telemetry setup; this lab is a local Evidence review.
  --no-cluster   Copy the evidence template and run the local signal-path analyzer. This is the default.
  --evidence     Evidence note path to create when it does not already exist.
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
python3 "$ANALYZER" \
  --collector "$LAB_DIR/collector.yaml" \
  --logs "$LAB_DIR/checkout-logs.txt" \
  --rule "$LAB_DIR/prometheus-rule.yaml" \
  --safe-rule "$LAB_DIR/safe-prometheus-rule.yaml" \
  --decision "$LAB_DIR/signal-path-decision.md"

echo
echo "Simulated checkout latency metrics:"
python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-latency --format metrics --events 2

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence $evidence_file"
