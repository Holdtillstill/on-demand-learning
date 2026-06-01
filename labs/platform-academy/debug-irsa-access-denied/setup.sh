#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-irsa-access-denied"
TEMPLATE="$LAB_DIR/evidence-template.md"
SIMULATOR="$LAB_DIR/irsa_simulator.py"

evidence_file="/tmp/irsa-access-denied-evidence.md"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/debug-irsa-access-denied/setup.sh [--no-cluster] [--evidence <file>]

Options:
  --no-cluster   Prepare the local evidence note and run the credential-free simulator. This is the default.
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
python3 "$SIMULATOR" \
  --serviceaccount "$LAB_DIR/serviceaccount.yaml" \
  --trust-policy "$LAB_DIR/trust-policy.json" \
  --fixed-trust-policy "$LAB_DIR/fixed-trust-policy.json" \
  --cloudtrail-event "$LAB_DIR/cloudtrail-event.json" \
  --permission-policy "$LAB_DIR/least-privilege-policy.json"

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence $evidence_file"
