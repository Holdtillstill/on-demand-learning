#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/inspect-linux-failure-evidence"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/linux_failure_analyzer.py"

evidence_file="/tmp/linux-failure-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/inspect-linux-failure-evidence/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage Linux failure artifacts. This is the default.
  --run-analyzer   Run the Linux failure analyzer after staging evidence.
  --evidence       Evidence note path to create when it does not already exist.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-cluster|--transcript)
      ;;
    --run-analyzer)
      run_analyzer=true
      ;;
    --cluster)
      fail "inspect-linux-failure-evidence uses captured evidence and does not support cluster setup"
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

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
echo "Staged Linux failure evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt"
echo "  sed -n '1,120p' labs/platform-academy/inspect-linux-failure-evidence/previous.log"
echo "  sed -n '1,80p' labs/platform-academy/inspect-linux-failure-evidence/id-output.txt"
echo "  sed -n '1,180p' labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --describe "$LAB_DIR/pod-describe.txt" \
    --previous-log "$LAB_DIR/previous.log" \
    --id-output "$LAB_DIR/id-output.txt" \
    --remediation "$LAB_DIR/remediation-note.md"
else
  echo "Analyzer is intentionally not run by default; inspect state, restart count, exit code, failing path, UID/GID, and rejected workaround evidence first, then run:"
  echo "  python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py \\"
  echo "    --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt \\"
  echo "    --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log \\"
  echo "    --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt \\"
  echo "    --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence $evidence_file"
