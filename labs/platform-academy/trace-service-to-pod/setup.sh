#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-service-to-pod"
START="$LAB_DIR/start.yaml"
FIXED="$LAB_DIR/fixed.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
TRANSCRIPT="$LAB_DIR/broken-evidence.txt"
ANALYZER="$LAB_DIR/service_route_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/trace-service-evidence.md"
preflight_only=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/trace-service-to-pod/setup.sh [--cluster] [--preflight] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Apply the broken manifest to a disposable Kubernetes context.
  --preflight    Check kubectl, context safety, API reachability, permissions, and namespace state, then exit.
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
    --preflight)
      mode="cluster"
      preflight_only=true
      ;;
    --no-cluster|--transcript)
      [[ "$preflight_only" == false ]] || fail "--preflight is only valid for cluster setup"
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
  sed -n '1,220p' "$TRANSCRIPT"
  echo
  python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$TRANSCRIPT"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence $evidence_file"
  exit 0
fi

preflight_kube_lab "Trace Service traffic to ready Pods" "payments" "$START"
if [[ "$preflight_only" == true ]]; then
  exit 0
fi

require_disposable_kube_context
kubectl delete namespace payments --ignore-not-found >/dev/null
kubectl apply -f "$START"
kubectl rollout status deploy/checkout -n payments --timeout=90s
prepare_evidence_note
python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$TRANSCRIPT"

echo
echo "Broken Service lab is ready in namespace payments."
echo "The Deployment is available, but the Service selector does not match the Pod labels."
echo
echo "Start with:"
echo "  kubectl describe svc checkout -n payments"
echo "  kubectl get pods -n payments --show-labels"
echo "  kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide"
