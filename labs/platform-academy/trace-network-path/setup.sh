#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-network-path"
BROKEN="$LAB_DIR/ingress-service.yaml"
FIXED="$LAB_DIR/fixed-ingress-service.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
HANDOFF="$LAB_DIR/incident-handoff.md"
NETWORK_EVIDENCE="$LAB_DIR/network-evidence.md"
ANALYZER="$LAB_DIR/network_path_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/network-path-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/trace-network-path/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Apply the broken manifest to a disposable Kubernetes context.
  --no-cluster   Copy the evidence template and print the captured network evidence. This is the default.
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
  echo "Captured incident handoff:"
  sed -n '1,180p' "$HANDOFF"
  echo
  echo "Captured network evidence:"
  sed -n '1,180p' "$NETWORK_EVIDENCE"
  echo
  python3 "$ANALYZER" --handoff "$HANDOFF" --evidence "$NETWORK_EVIDENCE" --broken "$BROKEN" --fixed "$FIXED"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/trace-network-path/validate.sh --evidence $evidence_file"
  exit 0
fi

require_disposable_kube_context
kubectl delete namespace payments --ignore-not-found >/dev/null
kubectl apply -f "$BROKEN"
kubectl wait --for=condition=Ready pod/checkout-example -n payments --timeout=90s
prepare_evidence_note
python3 "$ANALYZER" --handoff "$HANDOFF" --evidence "$NETWORK_EVIDENCE" --broken "$BROKEN" --fixed "$FIXED"

echo
echo "Broken network-path lab is ready in namespace payments."
echo "The Service routes to targetPort web, but the selected Pod only exposes a named port http."
echo "No real DNS, ALB, or Ingress controller is required for this local cluster path."
echo
echo "Start with:"
echo "  kubectl describe ingress checkout -n payments"
echo "  kubectl describe svc checkout -n payments"
echo "  kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o yaml"
