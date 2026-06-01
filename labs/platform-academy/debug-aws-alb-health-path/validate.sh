#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-aws-alb-health-path"
HEALTH="$LAB_DIR/target-health.json"
BROKEN="$LAB_DIR/ingress-service.yaml"
FIXED="$LAB_DIR/fixed-ingress-service.yaml"
EVENTS="$LAB_DIR/events.txt"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/alb_health_analyzer.py"
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

grep -q "Target.ResponseCodeMismatch" "$HEALTH" || fail "target-health.json should include ResponseCodeMismatch"
grep -q "Health checks failed with code 404" "$HEALTH" || fail "target-health.json should include HTTP 404 health failure"
grep -q "alb.ingress.kubernetes.io/healthcheck-path: /healthz" "$BROKEN" || fail "ingress-service.yaml should include /healthz health check"
grep -q "targetPort: web" "$BROKEN" || fail "ingress-service.yaml should include broken targetPort web"
grep -q "name: http" "$BROKEN" || fail "ingress-service.yaml should include Pod port name http"
grep -q "kind: Namespace" "$BROKEN" || fail "broken manifest should create the disposable namespace"
grep -q "http.server" "$BROKEN" || fail "broken manifest should run a local HTTP server on the declared port"
grep -q "no matching Pod port" "$EVENTS" || fail "events.txt should name the targetPort mismatch"
grep -q "alb.ingress.kubernetes.io/healthcheck-path: /" "$FIXED" || fail "fixed manifest should set health check path to /"
grep -q "targetPort: http" "$FIXED" || fail "fixed manifest should set targetPort http"
! grep -q "targetPort: web" "$FIXED" || fail "fixed manifest should not keep targetPort web"
grep -q "kind: Namespace" "$FIXED" || fail "fixed manifest should create the disposable namespace"
grep -q "http.server" "$FIXED" || fail "fixed manifest should run a local HTTP server on the declared port"
grep -q "## ALB Target Health Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for ALB target health evidence"
grep -q "## Kubernetes Routing Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Kubernetes routing evidence"
grep -q "## Application Contract Check" "$TEMPLATE" || fail "evidence-template.md should prompt for application health contract evidence"
grep -q "ALB health path analysis passed" "$ANALYZER" || fail "alb_health_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --target-health "$HEALTH" --events "$EVENTS" --broken "$BROKEN" --fixed "$FIXED" --quiet

echo "File checks passed for debug-aws-alb-health-path."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "ALB target-health reason" "Target\\.ResponseCodeMismatch|ResponseCodeMismatch|target health"
  require_evidence_match "$evidence_file" "HTTP 404 health failure" "404|Health checks failed"
  require_evidence_match "$evidence_file" "health check path" "/healthz|healthcheck-path|health check path"
  require_evidence_match "$evidence_file" "broken Service targetPort web" "targetPort[[:space:]]*:?[[:space:]]*web|targetPort web"
  require_evidence_match "$evidence_file" "Pod port name http" "name[[:space:]]*:?[[:space:]]*http|port named http|Pod port"
  require_evidence_match "$evidence_file" "local ALB health analyzer evidence" "ALB health path analysis passed|ALB health analyzer|Health path risk|Service/Pod risk"
  require_evidence_match "$evidence_file" "source manifest fix" "fixed-ingress-service\\.yaml|targetPort[[:space:]]*:?[[:space:]]*http|health check path|source manifest"
  require_evidence_match "$evidence_file" "owner decision" "AWS networking|Ingress|controller|app owner|owner"
  require_evidence_match "$evidence_file" "handoff, validation, or cleanup" "handoff|validation|validate|cleanup|next deploy|rollback"
  echo "Evidence checks passed for debug-aws-alb-health-path."
fi

app_status() {
  local path="$1"
  kubectl exec -n payments checkout-example -- python -c "import http.client; c=http.client.HTTPConnection('127.0.0.1', 8080, timeout=2); c.request('GET', '$path'); print(c.getresponse().status)"
}

if [[ "$run_cluster" == true ]]; then
  require_disposable_kube_context
  kubectl delete namespace payments --ignore-not-found >/dev/null
  kubectl apply -f "$BROKEN"
  kubectl wait --for=condition=Ready pod/checkout-example -n payments --timeout=90s

  broken_health_path="$(kubectl get ingress checkout -n payments -o jsonpath='{.metadata.annotations.alb\.ingress\.kubernetes\.io/healthcheck-path}')"
  [[ "$broken_health_path" == "/healthz" ]] || fail "broken Ingress should use /healthz, saw '$broken_health_path'"
  broken_target_port="$(kubectl get svc checkout -n payments -o jsonpath='{.spec.ports[0].targetPort}')"
  [[ "$broken_target_port" == "web" ]] || fail "broken Service should route to targetPort web, saw '$broken_target_port'"
  [[ "$(app_status /healthz)" == "404" ]] || fail "sample app should return 404 on /healthz"

  kubectl apply -f "$FIXED"
  fixed_health_path="$(kubectl get ingress checkout -n payments -o jsonpath='{.metadata.annotations.alb\.ingress\.kubernetes\.io/healthcheck-path}')"
  [[ "$fixed_health_path" == "/" ]] || fail "fixed Ingress should use /, saw '$fixed_health_path'"
  fixed_target_port="$(kubectl get svc checkout -n payments -o jsonpath='{.spec.ports[0].targetPort}')"
  [[ "$fixed_target_port" == "http" ]] || fail "fixed Service should route to targetPort http, saw '$fixed_target_port'"
  [[ "$(app_status /)" == "200" ]] || fail "sample app should return 200 on /"

  endpoint_ports=""
  for _ in {1..30}; do
    endpoint_ports="$(kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o jsonpath='{.items[*].ports[*].port}' 2>/dev/null || true)"
    [[ " $endpoint_ports " == *" 8080 "* ]] && break
    sleep 1
  done
  [[ " $endpoint_ports " == *" 8080 "* ]] || fail "fixed Service should publish EndpointSlice port 8080, saw '${endpoint_ports:-none}'"
  kubectl get ingress,svc,endpointslice,pod -n payments -o wide
fi
