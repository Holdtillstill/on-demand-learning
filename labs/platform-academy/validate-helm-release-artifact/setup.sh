#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/validate-helm-release-artifact"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/helm_release_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/helm-release-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/validate-helm-release-artifact/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note. This is the default.
  --run-analyzer   Run the rendered Helm release analyzer after staging evidence.
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
echo "Captured Helm release triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged Helm release artifact bundle:"
echo "  sed -n '1,220p' labs/platform-academy/validate-helm-release-artifact/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml"
echo "  sed -n '1,260p' labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml"
echo "  diff -u labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml || true"
echo "  sed -n '1,220p' labs/platform-academy/validate-helm-release-artifact/review-notes.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --before "$LAB_DIR/rendered-before.yaml" \
    --after "$LAB_DIR/rendered-after.yaml" \
    --safe "$LAB_DIR/safe-rendered-after.yaml" \
    --notes "$LAB_DIR/review-notes.md"
else
  echo "Analyzer is intentionally not run by default; inspect selector, image, runtime, exposure, and rollback evidence first, then run:"
  echo "  python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py \\"
  echo "    --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml \\"
  echo "    --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml \\"
  echo "    --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml \\"
  echo "    --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/validate-helm-release-artifact/validate.sh --evidence $evidence_file"
