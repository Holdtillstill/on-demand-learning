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
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-production-eks-review/setup.sh [--cluster] [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --cluster        Refuse live AWS setup; this lab is an architecture-review Evidence exercise.
  --no-cluster     Copy the evidence template and stage review artifacts. This is the default.
  --run-analyzer   Run the local production EKS review analyzer after staging evidence.
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
echo "Staged production EKS review packet:"
echo "  sed -n '1,220p' labs/platform-academy/design-production-eks-review/cluster-review.md"
echo "  sed -n '1,220p' labs/platform-academy/design-production-eks-review/launch-review.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" --review "$REVIEW" --launch "$LAUNCH"
else
  echo "Analyzer is intentionally not run by default; inspect private endpoint, Karpenter, cost, upgrade, and launch evidence first, then run:"
  echo "  python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py \\"
  echo "    --review labs/platform-academy/design-production-eks-review/cluster-review.md \\"
  echo "    --launch labs/platform-academy/design-production-eks-review/launch-review.md"
fi

echo
echo "Captured production EKS proposal excerpt:"
sed -n '1,120p' "$REVIEW"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-production-eks-review/validate.sh --evidence $evidence_file"
