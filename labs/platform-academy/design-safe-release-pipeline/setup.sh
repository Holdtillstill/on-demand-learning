#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-safe-release-pipeline"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/release_pipeline_analyzer.py"

evidence_file="/tmp/release-pipeline-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-safe-release-pipeline/setup.sh [--no-cluster] [--evidence <file>]

Options:
  --no-cluster   Prepare the local Evidence note and run the captured release pipeline analyzer. This is the default.
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
  --unsafe "$LAB_DIR/pipeline.yaml" \
  --safe "$LAB_DIR/safe-pipeline.yaml" \
  --checklist "$LAB_DIR/release-checklist.md" \
  --decision "$LAB_DIR/decision-record.md"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence $evidence_file"
