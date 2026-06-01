#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-terraform-eks-plan"
PLAN="$LAB_DIR/tfplan.txt"
REVIEW="$LAB_DIR/review.md"
DECISION="$LAB_DIR/decision-record.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/plan_analyzer.py"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

evidence_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --evidence)
      shift
      [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
      evidence_file="$1"
      ;;
    *)
      fail "unsupported option: $1"
      ;;
  esac
  shift
done

grep -q "must be replaced" "$PLAN" || fail "tfplan.txt should include node group replacement"
grep -q 'subnet_ids.*subnet-aaa111.*subnet-bbb222.*subnet-bbb222' "$PLAN" || fail "tfplan.txt should show subnet coverage regression"
grep -q "desired_size = 6 -> 3" "$PLAN" || fail "tfplan.txt should show desired capacity reduction"
grep -q "0.0.0.0/0" "$PLAN" || fail "tfplan.txt should show public ingress"
grep -q 'Action   = "eks:\*"' "$PLAN" || fail "tfplan.txt should show broad EKS IAM action"
grep -q "Do not approve" "$REVIEW" || fail "review.md should include the expected block decision"
grep -q "Do not approve" "$DECISION" || fail "decision-record.md should block the plan"
grep -q "least-privilege" "$DECISION" || fail "decision-record.md should require least privilege"
grep -q "rollback" "$DECISION" || fail "decision-record.md should require rollback notes"
grep -q "## Replacement And Capacity Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for replacement and capacity evidence"
grep -q "## Network And IAM Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for network and IAM evidence"
grep -q "## Approval Decision" "$TEMPLATE" || fail "evidence-template.md should prompt for approval decision evidence"
grep -q "Terraform plan risk analysis passed" "$ANALYZER" || fail "plan_analyzer.py should report a successful local plan risk analysis"

python3 "$ANALYZER" --plan "$PLAN" --quiet

echo "File checks passed for review-terraform-eks-plan."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "no-apply safety boundary" "no apply|not being run|do not apply|saved plan|plan artifact"
  require_evidence_match "$evidence_file" "node group replacement" "must be replaced|node group replacement|aws_eks_node_group"
  require_evidence_match "$evidence_file" "subnet coverage regression" "subnet-aaa111|subnet-bbb222|subnet coverage|multi-AZ|one subnet"
  require_evidence_match "$evidence_file" "capacity reduction" "desired capacity|desired_size|6 to 3|6 -> 3|max capacity"
  require_evidence_match "$evidence_file" "public ingress" "0\\.0\\.0\\.0/0|public ingress"
  require_evidence_match "$evidence_file" "broad IAM scope" "eks:\\*|least-privilege|least privilege|IAM"
  require_evidence_match "$evidence_file" "local plan analyzer evidence" "plan analyzer|plan risk analysis|Terraform plan risk analysis passed|blocking risk"
  require_evidence_match "$evidence_file" "block decision" "block|do not approve|do not apply"
  require_evidence_match "$evidence_file" "rollback or split-plan follow-up" "rollback|separate plans|split|follow-up|validation"
  echo "Evidence checks passed for review-terraform-eks-plan."
fi
