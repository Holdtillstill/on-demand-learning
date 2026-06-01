#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-tenant-boundaries"
BROKEN="$LAB_DIR/tenant-a.yaml"
FIXED="$LAB_DIR/fixed-tenant-a.yaml"
REVIEW="$LAB_DIR/review.md"
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

grep -q "name: tenant-a-temporary-admin" "$BROKEN" || fail "tenant-a.yaml should include the temporary admin binding"
grep -q "name: cluster-admin" "$BROKEN" || fail "tenant-a.yaml should bind cluster-admin"
grep -q 'resources: \["secrets"\]' "$BROKEN" || fail "tenant-a.yaml should include secret access for review"
grep -q "pod-security.kubernetes.io/enforce: baseline" "$BROKEN" || fail "tenant-a.yaml should start at baseline Pod Security"
grep -q "name: allow-all-egress" "$BROKEN" || fail "tenant-a.yaml should include the allow-all egress policy"
grep -q "Block onboarding" "$REVIEW" || fail "review.md should include the expected decision"
! grep -q "cluster-admin" "$FIXED" || fail "fixed-tenant-a.yaml should not include cluster-admin"
! grep -q 'resources: \["secrets"\]' "$FIXED" || fail "fixed-tenant-a.yaml should not grant secret access"
grep -q "pod-security.kubernetes.io/enforce: restricted" "$FIXED" || fail "fixed-tenant-a.yaml should enforce restricted Pod Security"
grep -q "name: default-deny-egress" "$FIXED" || fail "fixed-tenant-a.yaml should default-deny egress"
grep -q "## RBAC Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for RBAC evidence"
grep -q "## Pod Security Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Pod Security evidence"
grep -q "## NetworkPolicy Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for NetworkPolicy evidence"

echo "File checks passed for audit-tenant-boundaries."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "risky manifest or shared-cluster boundary" "tenant-a.yaml|not applied|shared cluster|cleanup"
  require_evidence_match "$evidence_file" "cluster-admin binding" "tenant-a-temporary-admin|cluster-admin|ClusterRoleBinding"
  require_evidence_match "$evidence_file" "secret access rule" "secrets|secret access|get.*list.*watch"
  require_evidence_match "$evidence_file" "Pod Security baseline vs restricted" "baseline|restricted|Pod Security"
  require_evidence_match "$evidence_file" "allow-all egress not a boundary" "allow-all-egress|default-deny|egress"
  require_evidence_match "$evidence_file" "block onboarding decision" "Block onboarding|block|not onboard"
  require_evidence_match "$evidence_file" "required safer changes" "remove cluster-admin|secret access|default-deny|exception|expiry"
  require_evidence_match "$evidence_file" "owner or validation evidence" "owner|validation|validate|cleanup"
  echo "Evidence checks passed for audit-tenant-boundaries."
fi
