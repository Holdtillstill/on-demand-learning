#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-terraform-eks-plan"
TEMPLATE="$LAB_DIR/evidence-template.md"
TRIAGE="$LAB_DIR/triage-notes.md"
ANALYZER="$LAB_DIR/plan_analyzer.py"

evidence_file="/tmp/terraform-eks-plan-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/review-terraform-eks-plan/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local evidence note. This is the default.
  --run-analyzer   Run the saved-plan risk analyzer after staging evidence.
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
echo "Staged Terraform EKS plan evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/tfplan.txt"
echo "  sed -n '1,180p' labs/platform-academy/review-terraform-eks-plan/review.md"
echo "  sed -n '1,220p' labs/platform-academy/review-terraform-eks-plan/decision-record.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" --plan "$LAB_DIR/tfplan.txt"
else
  echo "Analyzer is intentionally not run by default; inspect replacement, capacity, ingress, IAM, and rollback evidence first, then run:"
  echo "  python3 labs/platform-academy/review-terraform-eks-plan/plan_analyzer.py \\"
  echo "    --plan labs/platform-academy/review-terraform-eks-plan/tfplan.txt"
fi

echo
echo "Captured Terraform plan triage notes:"
sed -n '1,140p' "$TRIAGE"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/review-terraform-eks-plan/validate.sh --evidence $evidence_file"
