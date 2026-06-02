#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-production-eks-review"
REVIEW="$LAB_DIR/cluster-review.md"
LAUNCH="$LAB_DIR/launch-review.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
TRIAGE="$LAB_DIR/triage-notes.md"
ANALYZER="$LAB_DIR/production_review_analyzer.py"
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

grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "public and private endpoint is not launch approval" "$TRIAGE" || fail "triage-notes.md should reject endpoint-only approval"
grep -q "One missing PDB is not a follow-up" "$TRIAGE" || fail "triage-notes.md should reject missing-PDB deferral"
grep -q "A snapshot policy is not restore proof" "$TRIAGE" || fail "triage-notes.md should require restore proof"
grep -q "Cost labels are not optional after launch" "$TRIAGE" || fail "triage-notes.md should reject deferred cost ownership"

grep -q "Endpoint: public and private" "$REVIEW" || fail "cluster-review.md should include endpoint posture"
grep -q "payments/worker.*pdb=missing" "$REVIEW" || fail "cluster-review.md should include missing worker PDB"
grep -q "data/postgres.*volume=gp3-us-west-2a" "$REVIEW" || fail "cluster-review.md should include zonal stateful storage"
grep -q "Missing cost label on apps-c" "$REVIEW" || fail "cluster-review.md should include missing cost label"
grep -q "deprecated APIs" "$REVIEW" || fail "cluster-review.md should include deprecated API pause point"
grep -q "controller add-ons have no version compatibility matrix" "$REVIEW" || fail "cluster-review.md should include add-on compatibility risk"

grep -q "Block production launch" "$LAUNCH" || fail "launch-review.md should block launch"
grep -q "PDB exists for every critical workload" "$LAUNCH" || fail "launch-review.md should include PDB validation"
grep -q "Restore drill proves" "$LAUNCH" || fail "launch-review.md should include restore validation"
grep -q "FinOps owner" "$LAUNCH" || fail "launch-review.md should include cost ownership"

grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage false leads"
grep -q "## Access And Resilience Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for access and resilience evidence"
grep -q "## Cost And Upgrade Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for cost and upgrade evidence"
grep -q "## Launch Decision Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for launch decision evidence"
grep -q "Production EKS review analysis passed" "$ANALYZER" || fail "production_review_analyzer.py should report successful analysis"

python3 "$ANALYZER" --review "$REVIEW" --launch "$LAUNCH" --quiet

echo "File checks passed for design-production-eks-review."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|False Leads|public and private endpoint|missing PDB|snapshot policy|cost labels"
  require_evidence_match "$evidence_file" "endpoint posture" "public and private|endpoint"
  require_evidence_match "$evidence_file" "missing PDB" "pdb=missing|missing PDB|PDB"
  require_evidence_match "$evidence_file" "zonal storage and restore drill" "zonal|gp3-us-west-2a|restore drill|snapshot"
  require_evidence_match "$evidence_file" "missing cost label" "Missing cost label|cost label|FinOps"
  require_evidence_match "$evidence_file" "upgrade or add-on risk" "deprecated APIs|compatibility matrix|add-ons|upgrade"
  require_evidence_match "$evidence_file" "local production review analyzer evidence" "Production EKS review analysis passed|production review analyzer|review analysis"
  require_evidence_match "$evidence_file" "block launch decision" "Block launch|Block production launch|block"
  require_evidence_match "$evidence_file" "owners and validation criteria" "owner|validation|restore|PDB|cost"
  require_evidence_match "$evidence_file" "no-AWS or cleanup note" "no-AWS|cleanup|no cleanup|architecture-review"
  echo "Evidence checks passed for design-production-eks-review."
fi
