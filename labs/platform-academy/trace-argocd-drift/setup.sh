#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/trace-argocd-drift"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/drift_analyzer.py"
TRIAGE="$LAB_DIR/triage-notes.md"

evidence_file="/tmp/argocd-drift-evidence.md"
run_analyzer=false

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/trace-argocd-drift/setup.sh [--no-cluster] [--run-analyzer] [--evidence <file>]

Options:
  --no-cluster     Prepare the local evidence note and stage drift artifacts. This is the default.
  --run-analyzer   Run the desired/live drift analyzer after staging evidence.
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
echo "Captured ArgoCD drift triage notes:"
sed -n '1,220p' "$TRIAGE"
echo
echo "Staged ArgoCD drift evidence bundle:"
echo "  sed -n '1,220p' labs/platform-academy/trace-argocd-drift/triage-notes.md"
echo "  sed -n '1,220p' labs/platform-academy/trace-argocd-drift/argocd-app-report.txt"
echo "  sed -n '1,220p' labs/platform-academy/trace-argocd-drift/desired.yaml"
echo "  sed -n '1,220p' labs/platform-academy/trace-argocd-drift/live.yaml"
echo "  diff -u labs/platform-academy/trace-argocd-drift/desired.yaml labs/platform-academy/trace-argocd-drift/live.yaml || true"
echo
if [[ "$run_analyzer" == true ]]; then
  python3 "$ANALYZER" \
    --desired "$LAB_DIR/desired.yaml" \
    --live "$LAB_DIR/live.yaml" \
    --ignore-rule "$LAB_DIR/ignore-differences.yaml" \
    --report "$LAB_DIR/argocd-app-report.txt"
else
  echo "Analyzer is intentionally not run by default; inspect desired/live replicas, controller ownership, self-heal, ignore rule, and Git-owned field evidence first, then run:"
  echo "  python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py \\"
  echo "    --desired labs/platform-academy/trace-argocd-drift/desired.yaml \\"
  echo "    --live labs/platform-academy/trace-argocd-drift/live.yaml \\"
  echo "    --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml \\"
  echo "    --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt"
fi

echo
echo "Next: fill $evidence_file, then run:"
echo "  bash labs/platform-academy/trace-argocd-drift/validate.sh --evidence $evidence_file"
