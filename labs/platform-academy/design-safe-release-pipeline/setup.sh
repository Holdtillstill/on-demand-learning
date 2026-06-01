#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-safe-release-pipeline"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/release_pipeline_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/release-pipeline-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/design-safe-release-pipeline/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage release pipeline artifacts. This is the default.
  --run-analyzer   Run the captured release pipeline analyzer after staging evidence.
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
echo "Captured release pipeline triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged release pipeline review bundle:"
echo "  sed -n '1,220p' labs/platform-academy/design-safe-release-pipeline/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/design-safe-release-pipeline/pipeline.yaml"
echo "  sed -n '1,220p' labs/platform-academy/design-safe-release-pipeline/release-checklist.md"
echo "  diff -u labs/platform-academy/design-safe-release-pipeline/pipeline.yaml labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml || true"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --unsafe "$LAB_DIR/pipeline.yaml" \
    --safe "$LAB_DIR/safe-pipeline.yaml" \
    --checklist "$LAB_DIR/release-checklist.md" \
    --decision "$LAB_DIR/decision-record.md"
else
  echo "Analyzer is intentionally not run by default; inspect staging, smoke, approval, canary, rollback, and artifact evidence first, then run:"
  echo "  python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py \\"
  echo "    --unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml \\"
  echo "    --safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml \\"
  echo "    --checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md \\"
  echo "    --decision labs/platform-academy/design-safe-release-pipeline/decision-record.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence $evidence_file"
