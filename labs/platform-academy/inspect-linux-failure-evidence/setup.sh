#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/inspect-linux-failure-evidence"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/linux_failure_analyzer.py"

evidence_file="/tmp/linux-failure-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/inspect-linux-failure-evidence/setup.sh [--no-cluster] [--evidence <file>]

Options:
  --no-cluster   Prepare the local Evidence note and run the Linux failure analyzer. This is the default.
  --evidence     Evidence note path to create when it does not already exist.
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
python3 "$ANALYZER" \
  --describe "$LAB_DIR/pod-describe.txt" \
  --previous-log "$LAB_DIR/previous.log" \
  --id-output "$LAB_DIR/id-output.txt" \
  --remediation "$LAB_DIR/remediation-note.md"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence $evidence_file"
