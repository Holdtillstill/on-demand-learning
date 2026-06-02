#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/build-platform-career-proof-pack"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/career_proof_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/career-proof-evidence.md"
mode="no-cluster"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/build-platform-career-proof-pack/setup.sh [--cluster] [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --cluster        Refuse live setup; this lab is a local portfolio Evidence review.
  --no-cluster     Copy the evidence template and stage career artifact files. This is the default.
  --run-analyzer   Run the local career artifact analyzer after staging evidence.
  --evidence       Evidence note path to create when it does not already exist.
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
echo "Captured career artifact triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged career artifact review bundle:"
echo "  sed -n '1,220p' labs/platform-academy/build-platform-career-proof-pack/triage-notes.md"
echo "  sed -n '1,160p' labs/platform-academy/build-platform-career-proof-pack/job-skills.txt"
echo "  sed -n '1,200p' labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md"
echo "  sed -n '1,220p' labs/platform-academy/build-platform-career-proof-pack/readme-template.md"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --skills "$LAB_DIR/job-skills.txt" \
    --inventory "$LAB_DIR/evidence-inventory.md" \
    --proof "$LAB_DIR/completed-proof-readme.md" \
    --bullets "$LAB_DIR/resume-bullets.md" \
    --star "$LAB_DIR/star-stories.md"
else
  echo "Analyzer is intentionally not run by default; inspect skill demand, inventory, artifact README, resume, STAR, and redaction evidence first, then run:"
  echo "  python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py \\"
  echo "    --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt \\"
  echo "    --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md \\"
  echo "    --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md \\"
  echo "    --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md \\"
  echo "    --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md"
fi

echo
echo "Artifact README delta from template:"
diff -u "$LAB_DIR/readme-template.md" "$LAB_DIR/completed-proof-readme.md" || true

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence $evidence_file"
