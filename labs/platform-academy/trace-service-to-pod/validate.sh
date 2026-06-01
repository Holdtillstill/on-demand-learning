#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-service-to-pod"
START="$LAB_DIR/start.yaml"
FIXED="$LAB_DIR/fixed.yaml"
EVIDENCE="$LAB_DIR/broken-evidence.txt"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/service_route_analyzer.py"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"
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

  "$python_bin" "$checker" --lab trace-service-to-pod
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

grep -q "app: checkout$" "$START" || fail "start.yaml should contain the broken Service selector app=checkout"
[[ "$(grep -c "app: checkout-api" "$START")" -eq 2 ]] || fail "start.yaml should label only the Deployment selector and Pod template as checkout-api"
[[ "$(grep -c "app: checkout-api" "$FIXED")" -ge 3 ]] || fail "fixed.yaml should include checkout-api in the Service selector"
grep -q "targetPort: http" "$FIXED" || fail "fixed.yaml should keep the named targetPort"
grep -q "Selector:          app=checkout" "$EVIDENCE" || fail "broken-evidence.txt should include Service selector evidence"
grep -q "app=checkout-api,tier=web" "$EVIDENCE" || fail "broken-evidence.txt should include Pod label evidence"
grep -q "ENDPOINTS" "$EVIDENCE" || fail "broken-evidence.txt should include EndpointSlice evidence"
grep -q "## Service Selector Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Service selector evidence"
grep -q "## EndpointSlice Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for EndpointSlice evidence"
grep -q "Service routing analysis passed" "$ANALYZER" || fail "service_route_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$EVIDENCE" --quiet

run_structural_check
echo "File checks passed for trace-service-to-pod."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "scope, namespace, transcript, or cleanup boundary" "payments|no-cluster|broken-evidence\\.txt|cleanup"
  require_evidence_match "$evidence_file" "Service selector app=checkout" "Service selector|Selector:|app[=:][[:space:]]*checkout([^[:alnum:]_-]|$)|app=checkout([^[:alnum:]_-]|$)"
  require_evidence_match "$evidence_file" "Pod label app=checkout-api" "Pod label|Pod labels|app[=:][[:space:]]*checkout-api|app=checkout-api"
  require_evidence_match "$evidence_file" "EndpointSlice evidence" "EndpointSlice|endpointslice"
  require_evidence_match "$evidence_file" "empty or no-ready backend evidence" "no ready|empty|<none>|no backend|no addresses"
  require_evidence_match "$evidence_file" "local Service routing analyzer evidence" "Service routing analysis passed|Service routing analyzer|Selector risk|EndpointSlice risk"
  require_evidence_match "$evidence_file" "source manifest fix" "fixed\\.yaml|source-manifest|source manifest|source fix|fixed manifest"
  require_evidence_match "$evidence_file" "validation plus cleanup or fallback" "validate|validation|cleanup|fallback|post-fix"
  echo "Evidence checks passed for trace-service-to-pod."
fi

if [[ "$run_cluster" == true ]]; then
  require_disposable_kube_context
  kubectl delete namespace payments --ignore-not-found >/dev/null
  kubectl apply -f "$START"
  kubectl rollout status deploy/checkout -n payments --timeout=90s
  if kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o jsonpath='{.items[*].endpoints[*].addresses[*]}' | grep -q .; then
    fail "start.yaml should not create ready Service endpoints"
  fi
  kubectl apply -f "$FIXED"
  kubectl rollout status deploy/checkout -n payments --timeout=90s
  kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o jsonpath='{.items[*].endpoints[*].addresses[*]}' | grep -q . || fail "fixed.yaml should create ready Service endpoints"
  kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
fi
