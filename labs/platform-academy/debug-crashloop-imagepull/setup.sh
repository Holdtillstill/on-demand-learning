#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-crashloop-imagepull"
START="$LAB_DIR/start.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
TRANSCRIPT="$LAB_DIR/broken-evidence.txt"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/crashloop-imagepull-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/debug-crashloop-imagepull/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Apply the broken manifest to a disposable Kubernetes context.
  --no-cluster   Copy the evidence template and print the captured broken-state transcript. This is the default.
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
  echo "Captured broken-state transcript:"
  sed -n '1,260p' "$TRANSCRIPT"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --evidence $evidence_file"
  exit 0
fi

require_disposable_kube_context
kubectl delete namespace payments-debug --ignore-not-found >/dev/null
kubectl apply -f "$START"

for _ in {1..45}; do
  pod_status="$(kubectl get pods -n payments-debug 2>/dev/null || true)"
  if [[ "$pod_status" == *"CrashLoopBackOff"* ]] && {
    [[ "$pod_status" == *"ErrImagePull"* ]] || [[ "$pod_status" == *"ImagePullBackOff"* ]];
  }; then
    break
  fi
  sleep 2
done

kubectl get pods -n payments-debug
prepare_evidence_note

echo
echo "Broken crash/image-pull lab is ready in namespace payments-debug."
echo "One workload should show CrashLoopBackOff; the other should show ErrImagePull or ImagePullBackOff."
echo
echo "Start with:"
echo "  kubectl describe pods -n payments-debug -l app=checkout-crash"
echo "  kubectl logs -n payments-debug -l app=checkout-crash --previous"
echo "  kubectl describe pods -n payments-debug -l app=checkout-pull"
echo "  kubectl get events -n payments-debug --sort-by=.lastTimestamp"
