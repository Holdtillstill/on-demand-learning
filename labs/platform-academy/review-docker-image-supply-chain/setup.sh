#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/review-docker-image-supply-chain"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/supply_chain_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/docker-supply-chain-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/review-docker-image-supply-chain/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local Evidence note and stage image review artifacts. This is the default.
  --run-analyzer   Run the captured supply-chain analyzer after staging evidence.
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
echo "Captured Docker image supply-chain triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged Docker image supply-chain review bundle:"
echo "  sed -n '1,220p' labs/platform-academy/review-docker-image-supply-chain/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/review-docker-image-supply-chain/Dockerfile"
echo "  sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/image-inspect.json"
echo "  sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/history.txt"
echo "  diff -u labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile || true"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --dockerfile "$LAB_DIR/Dockerfile" \
    --inspect "$LAB_DIR/image-inspect.json" \
    --history "$LAB_DIR/history.txt" \
    --hardened "$LAB_DIR/hardened.Dockerfile" \
    --promotion "$LAB_DIR/promotion-note.md"
else
  echo "Analyzer is intentionally not run by default; inspect user, base image, secret, SBOM, digest, rollback, and promotion evidence first, then run:"
  echo "  python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py \\"
  echo "    --dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile \\"
  echo "    --inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json \\"
  echo "    --history labs/platform-academy/review-docker-image-supply-chain/history.txt \\"
  echo "    --hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile \\"
  echo "    --promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence $evidence_file"
