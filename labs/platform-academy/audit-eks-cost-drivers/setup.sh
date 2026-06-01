#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-eks-cost-drivers"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/cost_analyzer.py"

evidence_file="/tmp/eks-cost-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/audit-eks-cost-drivers/setup.sh [--no-cluster] [--evidence <file>]

Options:
  --no-cluster   Prepare the local Evidence note and run the captured EKS cost analyzer. This is the default.
  --evidence     Evidence note path to create when it does not already exist.
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
python3 "$ANALYZER" \
  --usage "$LAB_DIR/usage.csv" \
  --services "$LAB_DIR/services.txt" \
  --storage "$LAB_DIR/storage.txt" \
  --recommendations "$LAB_DIR/recommendations.md"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence $evidence_file"
