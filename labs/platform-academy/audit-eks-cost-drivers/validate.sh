#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-eks-cost-drivers"
USAGE="$LAB_DIR/usage.csv"
SERVICES="$LAB_DIR/services.txt"
STORAGE="$LAB_DIR/storage.txt"
RECS="$LAB_DIR/recommendations.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
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

grep -q "payments,checkout,6000,900" "$USAGE" || fail "usage.csv should include checkout over-request evidence"
grep -q "payments,worker,4000,350" "$USAGE" || fail "usage.csv should include worker over-request evidence"
grep -q "default,load-test,3000,0" "$USAGE" || fail "usage.csv should include idle unknown workload"
grep -q "abandoned-demo" "$SERVICES" || fail "services.txt should include abandoned load balancer"
grep -q "abandoned-cache" "$STORAGE" || fail "storage.txt should include abandoned PVC"
grep -q "Expected Savings" "$RECS" || fail "recommendations.md should include savings"
grep -q "Reliability Risk" "$RECS" || fail "recommendations.md should include risk"
grep -q "Restore previous requests" "$RECS" || fail "recommendations.md should include rollback"
grep -q "Weekly: unknown owner" "$RECS" || fail "recommendations.md should include review cadence"

grep -q "## Compute Waste Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for compute waste evidence"
grep -q "## Service And Storage Waste Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for service and storage evidence"
grep -q "## Recommendation Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for recommendation evidence"

echo "File checks passed for audit-eks-cost-drivers."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "over-requested workload rows" "payments,checkout|payments/checkout|payments,worker|payments/worker|over-request"
  require_evidence_match "$evidence_file" "unknown owner idle workload" "default,load-test|default/load-test|unknown owner|owner unknown"
  require_evidence_match "$evidence_file" "abandoned LoadBalancer" "abandoned-demo|LoadBalancer|estimated monthly cost"
  require_evidence_match "$evidence_file" "abandoned PVC or storage waste" "abandoned-cache|200Gi|gp2|PVC"
  require_evidence_match "$evidence_file" "expected savings" "Expected Savings|expected savings|savings"
  require_evidence_match "$evidence_file" "reliability risk" "Reliability Risk|reliability risk"
  require_evidence_match "$evidence_file" "rollback and review cadence" "Rollback|review cadence|Weekly"
  require_evidence_match "$evidence_file" "validation or no-AWS note" "validation|validate|no-AWS|cleanup"
  echo "Evidence checks passed for audit-eks-cost-drivers."
fi
