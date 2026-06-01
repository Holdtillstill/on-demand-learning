#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-yaml-before-apply"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/manifest_risk_analyzer.py"

evidence_file="/tmp/yaml-review-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/review-yaml-before-apply/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage manifest review artifacts. This is the default.
  --run-analyzer   Run the pre-apply manifest analyzer after staging evidence.
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
      fail "review-yaml-before-apply is a no-live-apply lab and does not support cluster setup"
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
echo "Staged pre-apply manifest review bundle:"
echo "  sed -n '1,220p' labs/platform-academy/review-yaml-before-apply/vendor.yaml"
echo "  sed -n '1,180p' labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml"
echo "  diff -u labs/platform-academy/review-yaml-before-apply/vendor.yaml labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml || true"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --vendor "$LAB_DIR/vendor.yaml" \
    --safe "$LAB_DIR/safe-baseline.yaml"
else
  echo "Analyzer is intentionally not run by default; inspect RBAC, namespace, secret, privileged, hostPath, credential, and safer-baseline evidence first, then run:"
  echo "  python3 labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py \\"
  echo "    --vendor labs/platform-academy/review-yaml-before-apply/vendor.yaml \\"
  echo "    --safe labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/review-yaml-before-apply/validate.sh --evidence $evidence_file"
