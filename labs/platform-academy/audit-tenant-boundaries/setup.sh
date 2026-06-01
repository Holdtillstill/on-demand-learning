#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/audit-tenant-boundaries"
BROKEN="$LAB_DIR/tenant-a.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
REVIEW="$LAB_DIR/review.md"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/tenant-boundaries-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/audit-tenant-boundaries/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Apply the risky tenant manifest to a disposable Kubernetes context.
  --no-cluster   Copy the evidence template and print the review packet. This is the default.
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
  echo "Captured tenant boundary review:"
  sed -n '1,180p' "$REVIEW"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence $evidence_file"
  exit 0
fi

require_disposable_kube_context
kubectl delete clusterrolebinding tenant-a-temporary-admin --ignore-not-found >/dev/null
kubectl delete namespace tenant-a --ignore-not-found >/dev/null
kubectl apply -f "$BROKEN"
prepare_evidence_note

echo
echo "Risky tenant boundary lab is ready in namespace tenant-a."
echo "The manifest intentionally grants cluster-admin, secret reads, baseline Pod Security, and allow-all egress."
echo "Use only this disposable context, then run cleanup."
echo
echo "Start with:"
echo "  kubectl get clusterrolebinding tenant-a-temporary-admin -o yaml"
echo "  kubectl auth can-i get secrets --as=system:serviceaccount:tenant-a:deployer -n tenant-a"
echo "  kubectl get networkpolicy -n tenant-a -o yaml"
