#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/inspect-linux-failure-evidence"
DESCRIBE="$LAB_DIR/pod-describe.txt"
LOG="$LAB_DIR/previous.log"
ID_OUT="$LAB_DIR/id-output.txt"
NOTE="$LAB_DIR/remediation-note.md"
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

grep -q "Reason:       CrashLoopBackOff" "$DESCRIBE" || fail "pod-describe.txt should show CrashLoopBackOff"
grep -q "Exit Code:    126" "$DESCRIBE" || fail "pod-describe.txt should show exit code 126"
grep -q "Restart Count:  8" "$DESCRIBE" || fail "pod-describe.txt should show restart count"
grep -q "/app/bin/checkout: Permission denied" "$LOG" || fail "previous.log should show permission denied"
grep -q "uid=10001(checkout)" "$ID_OUT" || fail "id-output.txt should show runtime user"
grep -q "not application logic or memory pressure" "$NOTE" || fail "remediation-note.md should reject wrong ownership"
grep -q "Running as root: hides the permission bug" "$NOTE" || fail "remediation-note.md should reject root workaround"

grep -q "## Container State Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for container state evidence"
grep -q "## Linux Identity And Permission Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for Linux identity evidence"
grep -q "## Remediation Decision Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for remediation decision evidence"

echo "File checks passed for inspect-linux-failure-evidence."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "CrashLoopBackOff state" "CrashLoopBackOff"
  require_evidence_match "$evidence_file" "exit code 126" "exit code[^0-9]{0,20}126|Exit Code:[[:space:]]*126|code 126"
  require_evidence_match "$evidence_file" "permission denied log" "Permission denied|/app/bin/checkout"
  require_evidence_match "$evidence_file" "runtime UID/GID evidence" "uid=10001|UID/GID 10001|runtime user"
  require_evidence_match "$evidence_file" "not memory pressure or app logic" "not memory|memory pressure|not application logic|permission"
  require_evidence_match "$evidence_file" "rejected root workaround" "root|run as root|Running as root"
  require_evidence_match "$evidence_file" "image permission remediation" "image file permissions|ownership|execute-bit|permission fix"
  require_evidence_match "$evidence_file" "validation or no-cluster note" "validation|validate|no-cluster|cleanup"
  echo "Evidence checks passed for inspect-linux-failure-evidence."
fi
