#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-irsa-access-denied"
SA="$LAB_DIR/serviceaccount.yaml"
TRUST="$LAB_DIR/trust-policy.json"
FIXED_TRUST="$LAB_DIR/fixed-trust-policy.json"
EVENT="$LAB_DIR/cloudtrail-event.json"
POLICY="$LAB_DIR/least-privilege-policy.json"
WORKLOAD_LOG="$LAB_DIR/workload-error.log"
TEMPLATE="$LAB_DIR/evidence-template.md"
SIMULATOR="$LAB_DIR/irsa_simulator.py"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

run_structural_check() {
  local checker="$ROOT/scripts/verify_platform_lab_artifacts.py"
  [[ -f "$checker" ]] || return 0

  local python_bin="${PYTHON:-}"
  if [[ -z "$python_bin" ]]; then
    if command -v python3.11 >/dev/null 2>&1; then
      python_bin="python3.11"
    elif command -v python3 >/dev/null 2>&1; then
      python_bin="python3"
    else
      fail "python3.11 or python3 is required for structural artifact checks"
    fi
  fi

  "$python_bin" "$checker" --lab debug-irsa-access-denied
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

grep -q "namespace: payments" "$SA" || fail "serviceaccount.yaml should place checkout in payments"
grep -q "role-arn" "$SA" || fail "serviceaccount.yaml should include IRSA role annotation"
grep -q "AWS_ROLE_ARN=arn:aws:iam::111122223333:role/payments-checkout-readonly" "$WORKLOAD_LOG" || fail "workload-error.log should include the runtime AWS_ROLE_ARN"
grep -q "serviceAccountName=checkout" "$WORKLOAD_LOG" || fail "workload-error.log should include the workload serviceAccountName"
grep -q "AccessDenied" "$WORKLOAD_LOG" || fail "workload-error.log should include the SDK AccessDenied"
grep -q "expected-subject=system:serviceaccount:payments:checkout" "$WORKLOAD_LOG" || fail "workload-error.log should include the expected trust subject"
grep -q "system:serviceaccount:default:checkout" "$TRUST" || fail "trust-policy.json should include the broken default namespace subject"
grep -q "system:serviceaccount:payments:checkout" "$FIXED_TRUST" || fail "fixed-trust-policy.json should scope trust to payments/checkout"
grep -q "AccessDenied" "$EVENT" || fail "cloudtrail-event.json should show AccessDenied"
grep -q "PutObject" "$EVENT" || fail "cloudtrail-event.json should show PutObject"
grep -q "payments-prod-receipts" "$EVENT" || fail "cloudtrail-event.json should include the receipts bucket"
grep -q '"Action": "s3:PutObject"' "$POLICY" || fail "least-privilege-policy.json should allow only s3:PutObject"
grep -q "arn:aws:s3:::payments-prod-receipts/receipts/\\*" "$POLICY" || fail "least-privilege-policy.json should scope the object prefix"
! grep -q '"Action": "s3:\*"' "$POLICY" || fail "least-privilege-policy.json should not use s3:*"
grep -q "IRSA simulation passed" "$SIMULATOR" || fail "irsa_simulator.py should report a successful local simulation"
grep -q "## Kubernetes Identity Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Kubernetes identity evidence"
grep -q "## Application Error Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for application error evidence"
grep -q "## Trust Policy Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for trust policy evidence"
grep -q "## CloudTrail Permission Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for CloudTrail permission evidence"

python3 "$SIMULATOR" \
  --serviceaccount "$SA" \
  --trust-policy "$TRUST" \
  --fixed-trust-policy "$FIXED_TRUST" \
  --cloudtrail-event "$EVENT" \
  --permission-policy "$POLICY" \
  --quiet

run_structural_check
echo "File checks passed for debug-irsa-access-denied."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "Kubernetes ServiceAccount identity" "payments/checkout|namespace: payments|serviceaccount:payments:checkout"
  require_evidence_match "$evidence_file" "annotated and runtime IRSA role" "role-arn|AWS_ROLE_ARN|payments-checkout-readonly|IAM role"
  require_evidence_match "$evidence_file" "application SDK AccessDenied" "workload-error\\.log|botocore|SDK|AccessDenied|PutObject"
  require_evidence_match "$evidence_file" "broken trust subject" "system:serviceaccount:default:checkout|default/checkout"
  require_evidence_match "$evidence_file" "fixed trust subject" "system:serviceaccount:payments:checkout|exact trust subject|payments:checkout"
  require_evidence_match "$evidence_file" "CloudTrail AccessDenied" "AccessDenied|CloudTrail"
  require_evidence_match "$evidence_file" "S3 PutObject and bucket prefix" "s3:PutObject|PutObject|payments-prod-receipts|receipts/"
  require_evidence_match "$evidence_file" "least-privilege permission scope" "least-privilege|least privilege|narrow|object-prefix|receipts/\\*"
  require_evidence_match "$evidence_file" "local simulator decision" "simulator|simulation|IRSA simulation passed|trust subject"
  require_evidence_match "$evidence_file" "wildcard scope rejected" "wildcard|s3:\\*|whole bucket|not use"
  require_evidence_match "$evidence_file" "validation or handoff" "validation|validate|handoff|rollout|cleanup"
  echo "Evidence checks passed for debug-irsa-access-denied."
fi
