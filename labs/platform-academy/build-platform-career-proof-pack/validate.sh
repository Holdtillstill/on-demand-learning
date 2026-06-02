#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
LAB_DIR="$ROOT/labs/platform-academy/build-platform-career-proof-pack"
SKILLS="$LAB_DIR/job-skills.txt"
INVENTORY="$LAB_DIR/evidence-inventory.md"
TEMPLATE="$LAB_DIR/readme-template.md"
PROOF="$LAB_DIR/completed-proof-readme.md"
BULLETS="$LAB_DIR/resume-bullets.md"
STAR="$LAB_DIR/star-stories.md"
TRIAGE="$LAB_DIR/triage-notes.md"
TEMPLATE_EVIDENCE="$LAB_DIR/evidence-template.md"
ANALYZER="$LAB_DIR/career_proof_analyzer.py"
source "$ROOT/labs/platform-academy/lib/evidence-check.sh"

fail() {
  echo "FAIL: $*" >&2
  exit 1
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

grep -q "Kubernetes, Terraform, AWS, CI/CD, incident response, observability" "$SKILLS" || fail "job-skills.txt should include repeated target skills"
grep -q "EKS, Helm, ArgoCD" "$SKILLS" || fail "job-skills.txt should include EKS delivery skills"
grep -q "Docker, supply chain, release engineering" "$SKILLS" || fail "job-skills.txt should include supply-chain skills"
grep -q "Candidate artifacts" "$INVENTORY" || fail "evidence-inventory.md should list candidate artifacts"
grep -q "Missing evidence to collect" "$INVENTORY" || fail "evidence-inventory.md should list missing evidence"
grep -q "Technical Talking Points" "$TEMPLATE" || fail "readme-template.md should include technical talking points"

grep -q "Kubernetes Service Debugging and Release Safety" "$PROOF" || fail "completed-proof-readme.md should name a concrete artifact project"
grep -q "kubectl describe svc checkout -n payments" "$PROOF" || fail "completed-proof-readme.md should include command validation"
grep -q "bash labs/platform-academy/verify-full-labs.sh" "$PROOF" || fail "completed-proof-readme.md should reference full-lab validation"
grep -q "digest promotion" "$PROOF" || fail "completed-proof-readme.md should include release evidence"
grep -q "Rollback" "$PROOF" || fail "completed-proof-readme.md should include rollback"

grep -q "repository-backed Kubernetes and platform engineering labs" "$BULLETS" || fail "resume-bullets.md should tie bullets to real lab work"
grep -q "profile-backed lab workbooks" "$BULLETS" || fail "resume-bullets.md should include product implementation evidence"
grep -q "digest, SBOM, scan" "$BULLETS" || fail "resume-bullets.md should include supply-chain release evidence"

grep -q "Incident Response" "$STAR" || fail "star-stories.md should include incident response"
grep -q "Security" "$STAR" || fail "star-stories.md should include security"
grep -q "Cost" "$STAR" || fail "star-stories.md should include cost"
grep -q "Release Safety" "$STAR" || fail "star-stories.md should include release safety"

grep -q "False Leads Ruled Out" "$TRIAGE" || fail "triage-notes.md should include false leads"
grep -q "A long list of completed labs is not credible" "$TRIAGE" || fail "triage-notes.md should reject lab-count-only claims"
grep -q "Resume bullets are weak" "$TRIAGE" || fail "triage-notes.md should reject duty-only bullets"
grep -q "STAR stories are not credible" "$TRIAGE" || fail "triage-notes.md should reject STAR stories without validation"
grep -q "Redaction is part of the artifact" "$TRIAGE" || fail "triage-notes.md should require public-safe redaction"
grep -q "## Triage Notes And False Leads" "$TEMPLATE_EVIDENCE" || fail "evidence-template.md should prompt for triage false leads"
grep -q "## Skill Demand Evidence" "$TEMPLATE_EVIDENCE" || fail "evidence-template.md should prompt for skill demand evidence"
grep -q "## Portfolio Artifact Evidence" "$TEMPLATE_EVIDENCE" || fail "evidence-template.md should prompt for portfolio artifact evidence"
grep -q "## Technical Review And Resume Evidence" "$TEMPLATE_EVIDENCE" || fail "evidence-template.md should prompt for technical review and resume evidence"
grep -q "Career artifact pack analysis passed" "$ANALYZER" || fail "career_proof_analyzer.py should report successful analysis"

python3 "$ANALYZER" --skills "$SKILLS" --inventory "$INVENTORY" --proof "$PROOF" --bullets "$BULLETS" --star "$STAR" --quiet

echo "File checks passed for build-platform-career-proof-pack."

if [[ -n "$evidence_file" ]]; then
  require_evidence_file "$evidence_file"
  require_evidence_match "$evidence_file" "triage notes and false leads" "triage-notes\\.md|False Leads|completed labs|duty-only|STAR|screenshots|redaction"
  require_evidence_match "$evidence_file" "repeated target skills" "Kubernetes|Terraform|AWS|CI/CD|incident response|observability"
  require_evidence_match "$evidence_file" "candidate artifact inventory" "Candidate artifacts|evidence inventory|Missing evidence"
  require_evidence_match "$evidence_file" "concrete artifact README" "Kubernetes Service Debugging|completed-proof-readme|artifact README"
  require_evidence_match "$evidence_file" "command or validator evidence" "kubectl describe svc|verify-full-labs|command|validation|validator"
  require_evidence_match "$evidence_file" "release and rollback evidence" "digest promotion|Rollback|rollback"
  require_evidence_match "$evidence_file" "resume bullet evidence" "resume bullet|repository-backed|profile-backed|digest, SBOM, scan"
  require_evidence_match "$evidence_file" "STAR story coverage" "Incident Response|Security|Cost|Release Safety|STAR"
  require_evidence_match "$evidence_file" "local career artifact analyzer evidence" "Career artifact pack analysis passed|career artifact analyzer|artifact pack analysis"
  require_evidence_match "$evidence_file" "public-safe or missing-evidence note" "public-safe|redaction|missing evidence|stronger evidence"
  echo "Evidence checks passed for build-platform-career-proof-pack."
fi
