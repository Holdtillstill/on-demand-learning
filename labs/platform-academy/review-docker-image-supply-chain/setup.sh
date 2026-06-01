#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-docker-image-supply-chain"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/supply_chain_analyzer.py"

evidence_file="/tmp/docker-supply-chain-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/review-docker-image-supply-chain/setup.sh [--no-cluster] [--evidence <file>]

Options:
  --no-cluster   Prepare the local Evidence note and run the captured supply-chain analyzer. This is the default.
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
  --dockerfile "$LAB_DIR/Dockerfile" \
  --inspect "$LAB_DIR/image-inspect.json" \
  --history "$LAB_DIR/history.txt" \
  --hardened "$LAB_DIR/hardened.Dockerfile" \
  --promotion "$LAB_DIR/promotion-note.md"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence $evidence_file"
