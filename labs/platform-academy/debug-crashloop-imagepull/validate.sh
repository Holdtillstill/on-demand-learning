#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-crashloop-imagepull"
START="$LAB_DIR/start.yaml"
FIXED="$LAB_DIR/fixed.yaml"
EVIDENCE="$LAB_DIR/broken-evidence.txt"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/failure_mode_analyzer.py"
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

  "$python_bin" "$checker" --lab debug-crashloop-imagepull
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

grep -q "missing DB_URL" "$START" || fail "start.yaml should include the runtime crash signal"
grep -q "exit 42" "$START" || fail "start.yaml should exit with a distinct crash code"
grep -q "registry.invalid.example/checkout:missing" "$START" || fail "start.yaml should include an invalid image reference"
grep -q "checkout healthy" "$FIXED" || fail "fixed.yaml should keep the crash deployment alive"
grep -q "image: nginx:1.25-alpine" "$FIXED" || fail "fixed.yaml should use a pullable image for checkout-pull"
grep -q "CrashLoopBackOff" "$EVIDENCE" || fail "broken-evidence.txt should include CrashLoopBackOff evidence"
grep -q "missing DB_URL" "$EVIDENCE" || fail "broken-evidence.txt should include previous-log evidence"
grep -q "ImagePullBackOff" "$EVIDENCE" || fail "broken-evidence.txt should include ImagePullBackOff evidence"
grep -q "registry.invalid.example/checkout:missing" "$EVIDENCE" || fail "broken-evidence.txt should include the invalid image reference"
grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "checkout-pull" "$TRIAGE" || fail "triage-notes.md should include checkout-pull evidence"
grep -q "owner split" "$TRIAGE" || fail "triage-notes.md should include owner split evidence"
grep -q "## Failure Classification" "$TEMPLATE" || fail "evidence-template.md should prompt for failure classification"
grep -q "## Triage Notes And False Leads" "$TEMPLATE" || fail "evidence-template.md should prompt for triage notes"
grep -q "## ImagePullBackOff Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for image-pull evidence"
grep -q "CrashLoop/ImagePull analysis passed" "$ANALYZER" || fail "failure_mode_analyzer.py should report a successful local analysis"

python3 "$ANALYZER" --start "$START" --fixed "$FIXED" --transcript "$EVIDENCE" --quiet

run_structural_check
echo "File checks passed for debug-crashloop-imagepull."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|triage notes|False Leads|false leads|false lead|restart"
  require_evidence_match "$evidence_file" "checkout-crash workload evidence" "checkout-crash"
  require_evidence_match "$evidence_file" "CrashLoopBackOff status" "CrashLoopBackOff"
  require_evidence_match "$evidence_file" "previous log message" "missing DB_URL"
  require_evidence_match "$evidence_file" "exit code 42" "exit code 42|exit 42|code 42|status 42"
  require_evidence_match "$evidence_file" "checkout-pull workload evidence" "checkout-pull"
  require_evidence_match "$evidence_file" "image pull failure status" "ImagePullBackOff|ErrImagePull"
  require_evidence_match "$evidence_file" "invalid image reference" "registry\\.invalid\\.example/checkout:missing"
  require_evidence_match "$evidence_file" "local failure-mode analyzer evidence" "CrashLoop/ImagePull analysis passed|failure-mode analyzer|CrashLoop evidence|ImagePull evidence"
  require_evidence_match "$evidence_file" "app/config owner action" "app/config|app config|application config"
  require_evidence_match "$evidence_file" "image or registry owner action" "image/registry|registry/image|image registry|registry owner|image reference"
  require_evidence_match "$evidence_file" "validation plus cleanup or fallback" "rollout|validate|validation|cleanup|fallback"
  echo "Evidence checks passed for debug-crashloop-imagepull."
fi

if [[ "$run_cluster" == true ]]; then
  require_disposable_kube_context
  kubectl delete namespace payments-debug --ignore-not-found >/dev/null
  kubectl apply -f "$START"
  for _ in {1..40}; do
    crash_reason="$(kubectl get pods -n payments-debug -l app=checkout-crash -o jsonpath='{.items[*].status.containerStatuses[*].state.waiting.reason}' 2>/dev/null || true)"
    pull_reason="$(kubectl get pods -n payments-debug -l app=checkout-pull -o jsonpath='{.items[*].status.containerStatuses[*].state.waiting.reason}' 2>/dev/null || true)"
    if [[ "$crash_reason" == *"CrashLoopBackOff"* ]] && { [[ "$pull_reason" == *"ErrImagePull"* ]] || [[ "$pull_reason" == *"ImagePullBackOff"* ]]; }; then
      break
    fi
    sleep 2
  done
  crash_reason="$(kubectl get pods -n payments-debug -l app=checkout-crash -o jsonpath='{.items[*].status.containerStatuses[*].state.waiting.reason}' 2>/dev/null || true)"
  pull_reason="$(kubectl get pods -n payments-debug -l app=checkout-pull -o jsonpath='{.items[*].status.containerStatuses[*].state.waiting.reason}' 2>/dev/null || true)"
  [[ "$crash_reason" == *"CrashLoopBackOff"* ]] || fail "checkout-crash should reach CrashLoopBackOff, saw '$crash_reason'"
  [[ "$pull_reason" == *"ErrImagePull"* || "$pull_reason" == *"ImagePullBackOff"* ]] || fail "checkout-pull should reach ErrImagePull/ImagePullBackOff, saw '$pull_reason'"
  kubectl logs -n payments-debug -l app=checkout-crash --previous | grep -q "missing DB_URL" || fail "checkout-crash previous logs should include missing DB_URL"
  kubectl apply -f "$FIXED"
  kubectl rollout status deploy/checkout-crash -n payments-debug --timeout=90s
  kubectl rollout status deploy/checkout-pull -n payments-debug --timeout=90s
fi
