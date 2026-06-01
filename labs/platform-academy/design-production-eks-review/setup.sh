#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-production-eks-review"
REVIEW="$LAB_DIR/cluster-review.md"
LAUNCH="$LAB_DIR/launch-review.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/production_review_analyzer.py"

evidence_file="/tmp/production-eks-review-evidence.md"
mode="no-cluster"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-production-eks-review/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Refuse live AWS setup; this lab is an architecture-review Evidence exercise.
  --no-cluster   Copy the evidence template and run the local production EKS review analyzer. This is the default.
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
  fail "cluster setup is intentionally unsupported; review the captured packet without mutating AWS or EKS"
fi

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
python3 "$ANALYZER" --review "$REVIEW" --launch "$LAUNCH"

echo
echo "Captured production EKS proposal excerpt:"
sed -n '1,120p' "$REVIEW"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-production-eks-review/validate.sh --evidence $evidence_file"
