#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/diagnose-eks-ip-exhaustion"
SNAPSHOT="$LAB_DIR/cluster-snapshot.txt"
PLAN="$LAB_DIR/remediation-plan.md"
DECISION="$LAB_DIR/decision-record.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/ip_exhaustion_analyzer.py"
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

grep -q "FailedScheduling 0/3 nodes are available: 3 Insufficient pods" "$SNAPSHOT" || fail "cluster-snapshot.txt should include scheduler pod-density pressure"
grep -q "FailedCreatePodSandBox failed to assign an IP address" "$SNAPSHOT" || fail "cluster-snapshot.txt should include failed IP assignment"
grep -q "subnet-bbb222 us-west-2b AvailableIPv4AddressCount=7" "$SNAPSHOT" || fail "cluster-snapshot.txt should show the constrained subnet"
grep -q "runningPods=29" "$SNAPSHOT" || fail "cluster-snapshot.txt should show nodes near maxPods"
grep -q "prefix delegation disabled" "$SNAPSHOT" || fail "cluster-snapshot.txt should show prefix delegation state"
grep -q "EKS IP exhaustion analysis passed" "$ANALYZER" || fail "ip_exhaustion_analyzer.py should report a successful local analysis"

grep -q "Pause the checkout scale-up" "$PLAN" || fail "remediation-plan.md should include immediate safety action"
grep -q "Do not randomly recycle Pods" "$PLAN" || fail "remediation-plan.md should reject pod churn"
grep -q "Enable VPC CNI prefix delegation" "$PLAN" || fail "remediation-plan.md should include prefix delegation as a reviewed fix"
grep -q "subnet available IPs" "$PLAN" || fail "remediation-plan.md should include capacity alerting"
grep -q "Rollback" "$PLAN" || fail "remediation-plan.md should include rollback"

grep -q "not an application restart problem" "$DECISION" || fail "decision-record.md should frame the ownership decision"
grep -q "Blind node scaling: rejected" "$DECISION" || fail "decision-record.md should reject blind node scaling"

grep -q "## Scheduler And Sandbox Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for scheduler and sandbox evidence"
grep -q "## Subnet And Pod-Density Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for subnet and pod-density evidence"
grep -q "## Owner And Remediation Decision" "$TEMPLATE" || fail "evidence-template.md should prompt for owner and remediation decision"

python3 "$ANALYZER" --snapshot "$SNAPSHOT" --quiet

echo "File checks passed for diagnose-eks-ip-exhaustion."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "scheduler pod-density pressure" "FailedScheduling|Insufficient pods|maxPods|pod-density"
  require_evidence_match "$evidence_file" "sandbox IP assignment failure" "FailedCreatePodSandBox|failed to assign an IP|IP allocation"
  require_evidence_match "$evidence_file" "constrained subnet" "subnet-bbb222|AvailableIPv4AddressCount=7|seven available"
  require_evidence_match "$evidence_file" "nodes near maxPods" "runningPods=29|29/29|28/29|maxPods"
  require_evidence_match "$evidence_file" "prefix delegation state" "prefix delegation disabled|prefix delegation"
  require_evidence_match "$evidence_file" "local IP exhaustion analyzer evidence" "IP exhaustion analyzer|IP exhaustion analysis|EKS IP exhaustion analysis passed|nodes near maxPods"
  require_evidence_match "$evidence_file" "not an app restart problem" "not an application restart|not restart|Do not restart|Do not randomly recycle"
  require_evidence_match "$evidence_file" "platform/network owner remediation" "platform|network|VPC CNI|subnet|owner"
  require_evidence_match "$evidence_file" "validation, alert, or no-credential note" "validation|capacity alert|rollback|no-credential|cleanup"
  echo "Evidence checks passed for diagnose-eks-ip-exhaustion."
fi
