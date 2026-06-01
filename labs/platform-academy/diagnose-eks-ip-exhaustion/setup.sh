#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/diagnose-eks-ip-exhaustion"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/ip_exhaustion_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/eks-ip-exhaustion-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/diagnose-eks-ip-exhaustion/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local evidence note. This is the default.
  --run-analyzer   Run the captured IP exhaustion analyzer after staging evidence.
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
echo "Captured capacity triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged EKS IP exhaustion evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt"
echo "  sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/remediation-plan.md"
echo "  sed -n '1,220p' labs/platform-academy/diagnose-eks-ip-exhaustion/decision-record.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" --snapshot "$LAB_DIR/cluster-snapshot.txt"
else
  echo "Analyzer is intentionally not run by default; inspect scheduler, CNI, subnet, and maxPods evidence first, then run:"
  echo "  python3 labs/platform-academy/diagnose-eks-ip-exhaustion/ip_exhaustion_analyzer.py \\"
  echo "    --snapshot labs/platform-academy/diagnose-eks-ip-exhaustion/cluster-snapshot.txt"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/diagnose-eks-ip-exhaustion/validate.sh --evidence $evidence_file"
