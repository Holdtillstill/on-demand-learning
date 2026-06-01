#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/run-incident-commander-tabletop"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/incident_tabletop_analyzer.py"

evidence_file="/tmp/incident-commander-evidence.md"
mode="no-cluster"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/run-incident-commander-tabletop/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Refuse live incident setup; this tabletop is a local Evidence exercise.
  --no-cluster   Copy the evidence template and run the local incident tabletop analyzer. This is the default.
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
  fail "cluster setup is intentionally unsupported; run the tabletop without changing live incident tooling"
fi

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
python3 "$ANALYZER" \
  --signals "$LAB_DIR/signals.md" \
  --roles "$LAB_DIR/roles.md" \
  --timeline "$LAB_DIR/timeline.md" \
  --brief "$LAB_DIR/commander-brief.md" \
  --completed-timeline "$LAB_DIR/completed-timeline.md"

echo
echo "Simulated incident log lines:"
python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-incident --format logs --events 3

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence $evidence_file"
