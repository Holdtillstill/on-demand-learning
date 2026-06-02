#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/debug-irsa-access-denied"
TEMPLATE="$LAB_DIR/evidence-template.md"
SIMULATOR="$LAB_DIR/irsa_simulator.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/irsa-access-denied-evidence.md"
run_simulator=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/debug-irsa-access-denied/setup.sh [--no-cluster] [--run-simulator] [--evidence <file>]

Options:
  --no-cluster      Prepare the local evidence note. This is the default.
  --run-simulator   Run the credential-free simulator after staging the evidence.
  --evidence        Evidence note path to create when it does not already exist.
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
    --run-simulator)
      run_simulator=true
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
echo "Captured IRSA triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged IRSA evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml"
echo "  sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/workload-error.log"
echo "  sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/trust-policy.json"
echo "  sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json"
echo
if [[ "$run_simulator" == true ]]; then
  python3 "$SIMULATOR" \
    --serviceaccount "$LAB_DIR/serviceaccount.yaml" \
    --trust-policy "$LAB_DIR/trust-policy.json" \
    --fixed-trust-policy "$LAB_DIR/fixed-trust-policy.json" \
    --cloudtrail-event "$LAB_DIR/cloudtrail-event.json" \
    --permission-policy "$LAB_DIR/least-privilege-policy.json"
else
  echo "Simulator is intentionally not run by default; inspect the evidence first, then run:"
  echo "  python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py \\"
  echo "    --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml \\"
  echo "    --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json \\"
  echo "    --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json \\"
  echo "    --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json \\"
  echo "    --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence $evidence_file"
