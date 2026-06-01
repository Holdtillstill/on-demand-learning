#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-service-to-pod"
START="$LAB_DIR/start.yaml"
FIXED="$LAB_DIR/fixed.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
TRANSCRIPT="$LAB_DIR/broken-evidence.txt"
TRIAGE="$LAB_DIR/triage-notes.md"
ANALYZER="$LAB_DIR/service_route_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/trace-service-evidence.md"
preflight_only=false
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/trace-service-to-pod/setup.sh [--cluster] [--preflight] [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --cluster        Apply the broken manifest to a disposable Kubernetes context.
  --preflight      Check kubectl, context safety, API reachability, permissions, and namespace state, then exit.
  --no-cluster     Copy the evidence template and print the captured broken-state transcript. This is the default.
  --run-analyzer   Run the local Service route analyzer after staging evidence.
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
  echo "Captured triage notes:"
  sed -n '1,220p' "$TRIAGE"
  echo
  echo "Captured broken-state transcript:"
  sed -n '1,220p' "$TRANSCRIPT"
  echo
  if [[ "$run_analyzer" == true ]]; then
    python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$TRANSCRIPT"
  else
    echo "Analyzer is intentionally not run by default; inspect selector, Pod label, EndpointSlice, and source manifest evidence first, then run:"
    echo "  python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py \\"
    echo "    --start labs/platform-academy/trace-service-to-pod/start.yaml \\"
    echo "    --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml \\"
    echo "    --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt"
  fi
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence $evidence_file"
  exit 0
fi

preflight_kube_lab \
  "Trace Service traffic to ready Pods" \
  "payments" \
  "$START" \
  "create|deployments.apps|payments" \
  "create|services|payments" \
  "get|endpointslices.discovery.k8s.io|payments"
if [[ "$preflight_only" == true ]]; then
  exit 0
fi

require_disposable_kube_context
kubectl delete namespace payments --ignore-not-found >/dev/null
kubectl apply -f "$START"
kubectl rollout status deploy/checkout -n payments --timeout=90s
prepare_evidence_note
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$TRANSCRIPT"
else
  echo "Analyzer is intentionally not run by default; inspect the live Service, Pod labels, and EndpointSlice before running the analyzer."
fi

echo
echo "Broken Service lab is ready in namespace payments."
echo "The Deployment is available, but the Service selector does not match the Pod labels."
echo
echo "Start with:"
echo "  sed -n '1,220p' labs/platform-academy/trace-service-to-pod/triage-notes.md"
echo "  kubectl describe svc checkout -n payments"
echo "  kubectl get pods -n payments --show-labels"
echo "  kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide"
