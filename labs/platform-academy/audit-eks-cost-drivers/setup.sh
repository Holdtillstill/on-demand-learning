#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-eks-cost-drivers"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/cost_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/eks-cost-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/audit-eks-cost-drivers/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage cost evidence. This is the default.
  --run-analyzer   Run the captured EKS cost analyzer after staging evidence.
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
echo "Captured EKS cost triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged EKS cost evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/audit-eks-cost-drivers/triage-notes.md"
echo "  sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/usage.csv"
echo "  sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/services.txt"
echo "  sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/storage.txt"
echo "  sed -n '1,220p' labs/platform-academy/audit-eks-cost-drivers/recommendations.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --usage "$LAB_DIR/usage.csv" \
    --services "$LAB_DIR/services.txt" \
    --storage "$LAB_DIR/storage.txt" \
    --recommendations "$LAB_DIR/recommendations.md"
else
  echo "Analyzer is intentionally not run by default; inspect cost, owner, savings, risk, and rollback evidence first, then run:"
  echo "  python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py \\"
  echo "    --usage labs/platform-academy/audit-eks-cost-drivers/usage.csv \\"
  echo "    --services labs/platform-academy/audit-eks-cost-drivers/services.txt \\"
  echo "    --storage labs/platform-academy/audit-eks-cost-drivers/storage.txt \\"
  echo "    --recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence $evidence_file"
