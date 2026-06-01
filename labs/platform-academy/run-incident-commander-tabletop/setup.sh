#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/run-incident-commander-tabletop"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/incident_tabletop_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/incident-commander-evidence.md"
mode="no-cluster"
run_analyzer=false
run_simulator=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/run-incident-commander-tabletop/setup.sh [--cluster] [--no-cluster] [--run-analyzer] [--run-simulator] [--evidence <file>]

Options:
  --cluster        Refuse live incident setup; this tabletop is a local Evidence exercise.
  --no-cluster     Copy the evidence template and stage local artifacts. This is the default.
  --run-analyzer   Run the local incident tabletop analyzer after staging evidence.
  --run-simulator  Emit simulated incident log lines after staging evidence.
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
  fail "cluster setup is intentionally unsupported; run the tabletop without changing live incident tooling"
fi

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
echo "Captured incident commander triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged incident tabletop evidence:"
echo "  sed -n '1,220p' labs/platform-academy/run-incident-commander-tabletop/triage-notes.md"
echo "  sed -n '1,180p' labs/platform-academy/run-incident-commander-tabletop/signals.md"
echo "  sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/roles.md"
echo "  sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/timeline.md"
echo "  python3 labs/platform-academy/simulator.py --scenario checkout-incident --format logs --events 5"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --signals "$LAB_DIR/signals.md" \
    --roles "$LAB_DIR/roles.md" \
    --timeline "$LAB_DIR/timeline.md" \
    --brief "$LAB_DIR/commander-brief.md" \
    --completed-timeline "$LAB_DIR/completed-timeline.md"
else
  echo "Analyzer is intentionally not run by default; inspect severity, roles, rollback, communications, and timeline evidence first, then run:"
  echo "  python3 labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py \\"
  echo "    --signals labs/platform-academy/run-incident-commander-tabletop/signals.md \\"
  echo "    --roles labs/platform-academy/run-incident-commander-tabletop/roles.md \\"
  echo "    --timeline labs/platform-academy/run-incident-commander-tabletop/timeline.md \\"
  echo "    --brief labs/platform-academy/run-incident-commander-tabletop/commander-brief.md \\"
  echo "    --completed-timeline labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md"
fi

echo
if [[ "$run_simulator" == true ]]; then
  echo "Simulated incident log lines:"
  python3 "$ROOT/labs/platform-academy/simulator.py" --scenario checkout-incident --format logs --events 3
else
  echo "Simulator is intentionally not run by default; inspect the tabletop packet first, then run:"
  echo "  python3 labs/platform-academy/simulator.py --scenario checkout-incident --format logs --events 3"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence $evidence_file"
