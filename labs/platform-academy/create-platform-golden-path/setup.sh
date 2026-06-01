#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/create-platform-golden-path"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/golden_path_analyzer.py"

evidence_file="/tmp/golden-path-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/create-platform-golden-path/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage golden-path artifacts. This is the default.
  --run-analyzer   Run the captured golden-path analyzer after staging evidence.
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
echo "Staged platform golden-path review bundle:"
echo "  sed -n '1,220p' labs/platform-academy/create-platform-golden-path/service-template.md"
echo "  sed -n '1,220p' labs/platform-academy/create-platform-golden-path/catalog-info.yaml"
echo "  diff -u labs/platform-academy/create-platform-golden-path/service-template.md labs/platform-academy/create-platform-golden-path/ready-service-template.md || true"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --start-template "$LAB_DIR/service-template.md" \
    --ready-template "$LAB_DIR/ready-service-template.md" \
    --catalog "$LAB_DIR/catalog-info.yaml" \
    --fixed-catalog "$LAB_DIR/fixed-catalog-info.yaml" \
    --decision "$LAB_DIR/decision-record.md"
else
  echo "Analyzer is intentionally not run by default; inspect ownership, runtime defaults, SLO, rollback, adoption, and catalog evidence first, then run:"
  echo "  python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py \\"
  echo "    --start-template labs/platform-academy/create-platform-golden-path/service-template.md \\"
  echo "    --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md \\"
  echo "    --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml \\"
  echo "    --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml \\"
  echo "    --decision labs/platform-academy/create-platform-golden-path/decision-record.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/create-platform-golden-path/validate.sh --evidence $evidence_file"
