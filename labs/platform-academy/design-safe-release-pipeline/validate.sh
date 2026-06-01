#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/design-safe-release-pipeline"
UNSAFE="$LAB_DIR/pipeline.yaml"
SAFE="$LAB_DIR/safe-pipeline.yaml"
CHECKLIST="$LAB_DIR/release-checklist.md"
DECISION="$LAB_DIR/decision-record.md"
TEMPLATE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/release_pipeline_analyzer.py"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

run_structural_check() {
  local checker="$ROOT/scripts/verify_platform_lab_artifacts.py"
  [[ -f "$checker" ]] || return 0

  local python_bin="${PYTHON:-}"
  if [[ -z "$python_bin" ]]; then
    if command -v python3.11 >/dev/null 2>&1; then
      python_bin="python3.11"
    elif command -v python3 >/dev/null 2>&1; then
      python_bin="python3"
    else
      fail "python3.11 or python3 is required for structural artifact checks"
    fi
  fi

  "$python_bin" "$checker" --lab design-safe-release-pipeline
}

evidence_file=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --evidence)
      shift
      [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
      evidence_file="$1"
      ;;
    *)
      fail "unsupported option: $1"
      ;;
  esac
  shift
done

grep -q "deploy-prod:" "$UNSAFE" || fail "pipeline.yaml should include the risky production deploy job"
grep -q "github.ref == 'refs/heads/main'" "$UNSAFE" || fail "pipeline.yaml should deploy directly from main"
grep -q "missing digest promotion" "$UNSAFE" || fail "pipeline.yaml should expose the digest-promotion gap"
grep -q "helm upgrade --install checkout charts/checkout -f values/prod.yaml" "$UNSAFE" || fail "pipeline.yaml should show direct prod Helm deployment"
! grep -q "deploy-staging:" "$UNSAFE" || fail "pipeline.yaml should not already include a staging gate"
! grep -q "trivy image" "$UNSAFE" || fail "pipeline.yaml should not already include image scanning"
! grep -q "smoke.sh" "$UNSAFE" || fail "pipeline.yaml should not already include smoke tests"

grep -q "Build once and promote by immutable digest" "$CHECKLIST" || fail "release-checklist.md should require digest promotion"
grep -q "Restrict production deployment permissions" "$CHECKLIST" || fail "release-checklist.md should require restricted production permissions"

grep -q "permissions:" "$SAFE" || fail "safe-pipeline.yaml should define workflow permissions"
grep -q "id-token: write" "$SAFE" || fail "safe-pipeline.yaml should use identity federation for deployment auth"
grep -q "security-events: write" "$SAFE" || fail "safe-pipeline.yaml should allow security evidence publishing"
grep -q "image-digest.txt" "$SAFE" || fail "safe-pipeline.yaml should persist the promoted image digest"
grep -q "trivy image" "$SAFE" || fail "safe-pipeline.yaml should scan the promoted image"
grep -q "syft" "$SAFE" || fail "safe-pipeline.yaml should emit SBOM evidence"
grep -q "helm template" "$SAFE" || fail "safe-pipeline.yaml should render manifests before deployment"
grep -q "kubeconform" "$SAFE" || fail "safe-pipeline.yaml should validate rendered manifests"
grep -q "conftest test" "$SAFE" || fail "safe-pipeline.yaml should run policy checks"
grep -q "deploy-staging:" "$SAFE" || fail "safe-pipeline.yaml should deploy staging before prod"
grep -q "environment: staging" "$SAFE" || fail "safe-pipeline.yaml should use a staging environment"
grep -q "environment: production" "$SAFE" || fail "safe-pipeline.yaml should require production environment approval"
grep -q "rollout.strategy=canary" "$SAFE" || fail "safe-pipeline.yaml should use a canary/progressive rollout setting"
grep -q "smoke.sh" "$SAFE" || fail "safe-pipeline.yaml should run smoke tests"
grep -q "rollback-if-slo-breach" "$SAFE" || fail "safe-pipeline.yaml should include an SLO rollback check"
! grep -q "helm upgrade --install checkout charts/checkout -f values/prod.yaml" "$SAFE" || fail "safe-pipeline.yaml should not deploy prod with the unsafe command"

grep -q "Block the current pipeline" "$DECISION" || fail "decision-record.md should document the block decision"
grep -q "Run smoke tests after staging and production rollout" "$DECISION" || fail "decision-record.md should document smoke-test evidence"
grep -q "Safe release pipeline analysis passed" "$ANALYZER" || fail "release_pipeline_analyzer.py should report a successful local analysis"

grep -q "## Unsafe Production Path Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for unsafe production evidence"
grep -q "## Gate And Artifact Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for gate and artifact evidence"
grep -q "## Release Decision And Rollback Evidence" "$TEMPLATE" || fail "evidence-template.md should prompt for release decision evidence"

python3 "$ANALYZER" \
  --unsafe "$UNSAFE" \
  --safe "$SAFE" \
  --checklist "$CHECKLIST" \
  --decision "$DECISION" \
  --quiet

run_structural_check
echo "File checks passed for design-safe-release-pipeline."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "unsafe direct production deploy" "deploy-prod|refs/heads/main|direct prod|helm upgrade"
  require_evidence_match "$evidence_file" "missing digest promotion" "missing digest|digest promotion|image-digest.txt|immutable digest"
  require_evidence_match "$evidence_file" "scan and SBOM gates" "trivy|SBOM|syft|scan"
  require_evidence_match "$evidence_file" "rendered manifest and policy gates" "helm template|kubeconform|conftest|policy"
  require_evidence_match "$evidence_file" "staging and production approval boundary" "deploy-staging|environment: staging|environment: production|approval"
  require_evidence_match "$evidence_file" "canary, smoke, and SLO rollback" "canary|smoke|rollback-if-slo-breach|SLO"
  require_evidence_match "$evidence_file" "local release pipeline analyzer evidence" "Safe release pipeline analysis passed|release pipeline analyzer|Artifact chain|Rollout chain"
  require_evidence_match "$evidence_file" "block pipeline decision" "Block the current pipeline|block|do not approve"
  require_evidence_match "$evidence_file" "validation or saved artifact evidence" "validation|validate|artifact|rollback|cleanup"
  echo "Evidence checks passed for design-safe-release-pipeline."
fi
