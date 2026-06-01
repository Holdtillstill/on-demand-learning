#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/build-platform-career-proof-pack"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/career_proof_analyzer.py"

evidence_file="/tmp/career-proof-evidence.md"
mode="no-cluster"

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/build-platform-career-proof-pack/setup.sh [--cluster] [--no-cluster] [--evidence <file>]

Options:
  --cluster      Refuse live setup; this lab is a local portfolio Evidence review.
  --no-cluster   Copy the evidence template and run the local career proof analyzer. This is the default.
  --evidence     Evidence note path to create when it does not already exist.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --cluster)
      mode="cluster"
      ;;
    --no-cluster|--transcript)
      mode="no-cluster"
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

if [[ "$mode" == "cluster" ]]; then
  fail "cluster setup is intentionally unsupported; review local portfolio artifacts only"
fi

if [[ -s "$evidence_file" ]]; then
  echo "Evidence note already exists: $evidence_file"
else
  cp "$TEMPLATE" "$evidence_file"
  echo "Created evidence note: $evidence_file"
fi

echo
python3 "$ANALYZER" \
  --skills "$LAB_DIR/job-skills.txt" \
  --inventory "$LAB_DIR/evidence-inventory.md" \
  --proof "$LAB_DIR/completed-proof-readme.md" \
  --bullets "$LAB_DIR/resume-bullets.md" \
  --star "$LAB_DIR/star-stories.md"

echo
echo "Proof README delta from template:"
diff -u "$LAB_DIR/readme-template.md" "$LAB_DIR/completed-proof-readme.md" || true

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence $evidence_file"
