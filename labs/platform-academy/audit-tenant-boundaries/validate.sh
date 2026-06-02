#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-tenant-boundaries"
BROKEN="$LAB_DIR/tenant-a.yaml"
FIXED="$LAB_DIR/fixed-tenant-a.yaml"
REVIEW="$LAB_DIR/review.md"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/tenant_boundary_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

run_cluster=false
evidence_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      run_cluster=true
      ;;
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
grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "A temporary cluster-admin binding is not safe" "$TRIAGE" || fail "triage-notes.md should reject temporary admin approval"
grep -q "A NetworkPolicy object is not a boundary" "$TRIAGE" || fail "triage-notes.md should reject policy-object false confidence"
grep -q "Client-side dry-run proves YAML parseability" "$TRIAGE" || fail "triage-notes.md should reject dry-run approval"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage false leads"
grep -q "## RBAC Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for RBAC evidence"
grep -q "## Pod Security Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Pod Security evidence"
grep -q "## NetworkPolicy Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for NetworkPolicy evidence"
grep -q "Tenant boundary analysis passed" "$ANALYZER" || fail "tenant_boundary_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --broken "$BROKEN" --fixed "$FIXED" --review "$REVIEW" --quiet

echo "File checks passed for audit-tenant-boundaries."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "risky manifest or shared-cluster boundary" "tenant-a.yaml|not applied|shared cluster|cleanup"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|False Leads|temporary cluster-admin|dry-run|NetworkPolicy object"
  require_evidence_match "$evidence_file" "cluster-admin binding" "tenant-a-temporary-admin|cluster-admin|ClusterRoleBinding"
  require_evidence_match "$evidence_file" "secret access rule" "secrets|secret access|get.*list.*watch"
  require_evidence_match "$evidence_file" "Pod Security baseline vs restricted" "baseline|restricted|Pod Security"
  require_evidence_match "$evidence_file" "allow-all egress not a boundary" "allow-all-egress|default-deny|egress"
  require_evidence_match "$evidence_file" "local tenant boundary analyzer evidence" "Tenant boundary analysis passed|tenant boundary analyzer|RBAC risk|NetworkPolicy risk"
  require_evidence_match "$evidence_file" "block onboarding decision" "Block onboarding|block|not onboard"
  require_evidence_match "$evidence_file" "required safer changes" "remove cluster-admin|secret access|default-deny|exception|expiry"
  require_evidence_match "$evidence_file" "owner or validation evidence" "owner|validation|validate|cleanup"
  echo "Evidence checks passed for audit-tenant-boundaries."
fi

if [[ "$run_cluster" == true ]]; then
  require_disposable_kube_context
  kubectl delete clusterrolebinding tenant-a-temporary-admin --ignore-not-found >/dev/null
  kubectl delete namespace tenant-a --ignore-not-found >/dev/null
  kubectl apply -f "$BROKEN"

  role_ref="$(kubectl get clusterrolebinding tenant-a-temporary-admin -o jsonpath='{.roleRef.name}')"
  [[ "$role_ref" == "cluster-admin" ]] || fail "risky manifest should bind cluster-admin, saw '$role_ref'"
  kubectl auth can-i get secrets --as=system:serviceaccount:tenant-a:deployer -n tenant-a | grep -q yes || fail "risky deployer should be able to get secrets"
  pod_security="$(kubectl get namespace tenant-a -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}')"
  [[ "$pod_security" == "baseline" ]] || fail "risky namespace should enforce baseline, saw '$pod_security'"
  kubectl get networkpolicy allow-all-egress -n tenant-a -o yaml | grep -q "egress:" || fail "risky policy should include egress rules"

  kubectl apply -f "$FIXED"
  kubectl delete clusterrolebinding tenant-a-temporary-admin --ignore-not-found >/dev/null

  if kubectl get clusterrolebinding tenant-a-temporary-admin >/dev/null 2>&1; then
    fail "fixed state should remove tenant-a-temporary-admin"
  fi
  if kubectl auth can-i get secrets --as=system:serviceaccount:tenant-a:deployer -n tenant-a | grep -q yes; then
    fail "fixed deployer should not be able to get secrets"
  fi
  fixed_pod_security="$(kubectl get namespace tenant-a -o jsonpath='{.metadata.labels.pod-security\.kubernetes\.io/enforce}')"
  [[ "$fixed_pod_security" == "restricted" ]] || fail "fixed namespace should enforce restricted, saw '$fixed_pod_security'"
  kubectl get networkpolicy default-deny-egress -n tenant-a >/dev/null
  kubectl get namespace,role,rolebinding,networkpolicy -n tenant-a
fi
