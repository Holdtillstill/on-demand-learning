#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-tenant-boundaries"
BROKEN="$LAB_DIR/tenant-a.yaml"
FIXED="$LAB_DIR/fixed-tenant-a.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
REVIEW="$LAB_DIR/review.md"
ANALYZER="$LAB_DIR/tenant_boundary_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/tenant-boundaries-evidence.md"
preflight_only=false
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/audit-tenant-boundaries/setup.sh [--cluster] [--preflight] [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --cluster        Apply the risky tenant manifest to a disposable Kubernetes context.
  --preflight      Check kubectl, context safety, API reachability, permissions, and namespace state, then exit.
  --no-cluster     Copy the evidence template and stage tenant boundary artifacts. This is the default.
  --run-analyzer   Run the local tenant boundary analyzer after staging evidence.
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
    --preflight)
      mode="cluster"
      preflight_only=true
      ;;
    --no-cluster|--transcript)
      [[ "$preflight_only" == false ]] || fail "--preflight is only valid for cluster setup"
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

prepare_evidence_note() {
  if [[ -s "$evidence_file" ]]; then
    echo "Evidence note already exists: $evidence_file"
  else
    cp "$TEMPLATE" "$evidence_file"
    echo "Created evidence note: $evidence_file"
  fi
}

if [[ "$mode" == "no-cluster" ]]; then
  prepare_evidence_note
  echo
  echo "Captured tenant boundary triage notes:"
  sed -n '1,220p' "$TRIAGE"
  echo
  echo "Captured tenant boundary review:"
  sed -n '1,180p' "$REVIEW"
  echo
  echo "Staged tenant boundary manifests:"
  echo "  sed -n '1,220p' labs/platform-academy/audit-tenant-boundaries/triage-notes.md"
  echo "  sed -n '1,240p' labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml"
  echo "  diff -u labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml || true"
  echo
  if [[ "$run_analyzer" == true ]]; then
    python3 "$ANALYZER" --broken "$BROKEN" --fixed "$FIXED" --review "$REVIEW"
  else
    echo "Analyzer is intentionally not run by default; inspect RBAC, secret access, Pod Security, NetworkPolicy, exception, and owner evidence first, then run:"
    echo "  python3 labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py \\"
    echo "    --broken labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml \\"
    echo "    --fixed labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml \\"
    echo "    --review labs/platform-academy/audit-tenant-boundaries/review.md"
  fi
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence $evidence_file"
  exit 0
fi

preflight_kube_lab \
  "Audit Kubernetes tenant boundaries" \
  "tenant-a" \
  "$BROKEN" \
  "create|serviceaccounts|tenant-a" \
  "create|roles.rbac.authorization.k8s.io|tenant-a" \
  "create|rolebindings.rbac.authorization.k8s.io|tenant-a" \
  "create|networkpolicies.networking.k8s.io|tenant-a" \
  "create|clusterrolebindings.rbac.authorization.k8s.io|" \
  "delete|clusterrolebindings.rbac.authorization.k8s.io|"
if [[ "$preflight_only" == true ]]; then
  exit 0
fi

require_disposable_kube_context
kubectl delete clusterrolebinding tenant-a-temporary-admin --ignore-not-found >/dev/null
kubectl delete namespace tenant-a --ignore-not-found >/dev/null
kubectl apply -f "$BROKEN"
prepare_evidence_note
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" --broken "$BROKEN" --fixed "$FIXED" --review "$REVIEW"
else
  echo "Analyzer is intentionally not run by default; inspect live RBAC, secret access, Pod Security, NetworkPolicy, and exception evidence before running the analyzer."
fi

echo
echo "Risky tenant boundary lab is ready in namespace tenant-a."
echo "The manifest intentionally grants cluster-admin, secret reads, baseline Pod Security, and allow-all egress."
echo "Use only this disposable context, then run cleanup."
echo
echo "Start with:"
echo "  kubectl get clusterrolebinding tenant-a-temporary-admin -o yaml"
echo "  kubectl auth can-i get secrets --as=system:serviceaccount:tenant-a:deployer -n tenant-a"
echo "  kubectl get networkpolicy -n tenant-a -o yaml"
