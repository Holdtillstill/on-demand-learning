#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-aws-alb-health-path"
HEALTH="$LAB_DIR/target-health.json"
BROKEN="$LAB_DIR/ingress-service.yaml"
FIXED="$LAB_DIR/fixed-ingress-service.yaml"
EVENTS="$LAB_DIR/events.txt"
TEMPLATE="$LAB_DIR/evidence-template.md"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

evidence_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
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
grep -q "no matching Pod port" "$EVENTS" || fail "events.txt should name the targetPort mismatch"
grep -q "alb.ingress.kubernetes.io/healthcheck-path: /" "$FIXED" || fail "fixed manifest should set health check path to /"
grep -q "targetPort: http" "$FIXED" || fail "fixed manifest should set targetPort http"
! grep -q "targetPort: web" "$FIXED" || fail "fixed manifest should not keep targetPort web"
grep -q "## ALB Target Health Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for ALB target health evidence"
grep -q "## Kubernetes Routing Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Kubernetes routing evidence"
grep -q "## Application Contract Check" "$TEMPLATE" || fail "evidence-template.md should prompt for application health contract evidence"

echo "File checks passed for debug-aws-alb-health-path."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "ALB target-health reason" "Target\\.ResponseCodeMismatch|ResponseCodeMismatch|target health"
  require_evidence_match "$evidence_file" "HTTP 404 health failure" "404|Health checks failed"
  require_evidence_match "$evidence_file" "health check path" "/healthz|healthcheck-path|health check path"
  require_evidence_match "$evidence_file" "broken Service targetPort web" "targetPort[[:space:]]*:?[[:space:]]*web|targetPort web"
  require_evidence_match "$evidence_file" "Pod port name http" "name[[:space:]]*:?[[:space:]]*http|port named http|Pod port"
  require_evidence_match "$evidence_file" "source manifest fix" "fixed-ingress-service\\.yaml|targetPort[[:space:]]*:?[[:space:]]*http|health check path|source manifest"
  require_evidence_match "$evidence_file" "owner decision" "AWS networking|Ingress|controller|app owner|owner"
  require_evidence_match "$evidence_file" "handoff, validation, or cleanup" "handoff|validation|validate|cleanup|next deploy|rollback"
  echo "Evidence checks passed for debug-aws-alb-health-path."
fi
