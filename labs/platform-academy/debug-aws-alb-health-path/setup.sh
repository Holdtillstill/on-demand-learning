#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-aws-alb-health-path"
BROKEN="$LAB_DIR/ingress-service.yaml"
FIXED="$LAB_DIR/fixed-ingress-service.yaml"
TEMPLATE="$LAB_DIR/evidence-template.md"
HEALTH="$LAB_DIR/target-health.json"
EVENTS="$LAB_DIR/events.txt"
ANALYZER="$LAB_DIR/alb_health_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

mode="no-cluster"
evidence_file="/tmp/alb-health-path-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/debug-aws-alb-health-path/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Apply the broken manifest to a disposable Kubernetes context.
  --no-cluster   Copy the evidence template and print the captured ALB/controller evidence. This is the default.
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
  echo "Captured ALB target health:"
  sed -n '1,180p' "$HEALTH"
  echo
  echo "Captured controller events:"
  sed -n '1,180p' "$EVENTS"
  echo
  python3 "$ANALYZER" --target-health "$HEALTH" --events "$EVENTS" --broken "$BROKEN" --fixed "$FIXED"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence $evidence_file"
  exit 0
fi

require_disposable_kube_context
kubectl delete namespace payments --ignore-not-found >/dev/null
kubectl apply -f "$BROKEN"
kubectl wait --for=condition=Ready pod/checkout-example -n payments --timeout=90s
prepare_evidence_note
python3 "$ANALYZER" --target-health "$HEALTH" --events "$EVENTS" --broken "$BROKEN" --fixed "$FIXED"

echo
echo "Broken ALB health-path lab is ready in namespace payments."
echo "The Ingress asks ALB to check /healthz, the app returns 404 there, and the Service routes to targetPort web."
echo "No AWS account or ALB controller is required for this local cluster path."
echo
echo "Start with:"
echo "  kubectl describe ingress checkout -n payments"
echo "  kubectl describe svc checkout -n payments"
echo "  kubectl exec -n payments checkout-example -- python -c 'import http.client; c=http.client.HTTPConnection(\"127.0.0.1\", 8080); c.request(\"GET\", \"/healthz\"); print(c.getresponse().status)'"
