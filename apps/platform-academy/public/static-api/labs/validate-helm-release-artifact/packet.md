# Validate a Helm release artifact

Track: Helm
Level: Intermediate
Lab tier: full
Estimated time: 40 minutes

## Scenario

A chart renders successfully but may change immutable selectors or create unsafe resources.

## Guided run sequence

1. Prepare workspace
   - No cluster or Helm install required for the baseline review path.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup validate-helm-release-artifact
   - bash labs/platform-academy/validate-helm-release-artifact/setup.sh --evidence /tmp/helm-release-evidence.md
2. Investigate safely
   - Review rendered YAML instead of trusting chart success.
   - Find immutable selector changes and risky security changes.
   - Use the local analyzer to prove selector, image, runtime, exposure, and safer-target evidence.
   - Write an approval decision with rollback limitations.
3. Prove the finding
   - The Deployment selector changes between rendered versions.
   - The image changes from digest-pinned to the mutable latest tag.
   - The rendered output introduces privileged mode and a LoadBalancer.
   - The local analyzer reports Helm release artifact analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/validate-helm-release-artifact/cleanup.sh
   - Read the before/after YAML files and complete the review without Helm.
   - Block the release in writing if selector, image, security, or exposure risk is unresolved.

## Evidence artifact map

- `labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml` - Manifest
- `labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml` - Manifest
- `labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml` - Target artifact
- `labs/platform-academy/validate-helm-release-artifact/review-notes.md` - Decision note
- `labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py` - Lab artifact
- `labs/platform-academy/validate-helm-release-artifact/setup.sh` - Lab artifact
- `labs/platform-academy/validate-helm-release-artifact/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/validate-helm-release-artifact/validate.sh` - Self-check script
- `labs/platform-academy/validate-helm-release-artifact/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml
- labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml
- labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml
- labs/platform-academy/validate-helm-release-artifact/review-notes.md
- labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py
- labs/platform-academy/validate-helm-release-artifact/setup.sh
- labs/platform-academy/validate-helm-release-artifact/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/validate-helm-release-artifact/validate.sh
- labs/platform-academy/validate-helm-release-artifact/cleanup.sh

## Worksheet prompts

- [ ] Record the rendered artifact, target environment, reviewer, and confirmation that the unsafe render was not applied.
- [ ] Paste the immutable selector change evidence from rendered-before.yaml and rendered-after.yaml.
- [ ] Paste the image, securityContext, and Service exposure regressions.
- [ ] Explain rollback risk and which chart/value owners must approve changes.
- [ ] Write the release decision and required safer rendered target.
- [ ] Capture validation output and the evidence artifacts you would save for release review.

## Prerequisites

- [ ] No cluster or Helm install required for the baseline review path.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup validate-helm-release-artifact
- bash labs/platform-academy/validate-helm-release-artifact/setup.sh --evidence /tmp/helm-release-evidence.md
- sed -n '1,180p' labs/platform-academy/validate-helm-release-artifact/review-notes.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace validate-helm-release-artifact --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip validate-helm-release-artifact-learner-workspace.zip
- cd validate-helm-release-artifact
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Review rendered YAML instead of trusting chart success.
- [ ] Find immutable selector changes and risky security changes.
- [ ] Use the local analyzer to prove selector, image, runtime, exposure, and safer-target evidence.
- [ ] Write an approval decision with rollback limitations.

## Runbook commands

- diff -u labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml || true
- grep -n "selector:\|latest\|privileged\|LoadBalancer" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml
- python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md

## Expected evidence

- [ ] The Deployment selector changes between rendered versions.
- [ ] The image changes from digest-pinned to the mutable latest tag.
- [ ] The rendered output introduces privileged mode and a LoadBalancer.
- [ ] The local analyzer reports Helm release artifact analysis passed.

## Validation commands

- bash labs/platform-academy/validate-helm-release-artifact/validate.sh
- bash labs/platform-academy/validate-helm-release-artifact/validate.sh --evidence /tmp/helm-release-evidence.md
- python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md
- grep -n "app: checkout" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml
- grep -n "privileged: true" labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml

## Validation checks

- [ ] No-apply safety boundary recorded
- [ ] Selector before/after evidence captured
- [ ] Mutable image evidence captured
- [ ] Privileged runtime and LoadBalancer evidence captured
- [ ] Rollback risk and owner questions written
- [ ] Safer render decision recorded
- [ ] Helm release analysis, validation output, and saved evidence recorded

## Rubric

- [ ] Preserves the no-apply safety boundary and names the rendered artifact under review.
- [ ] Captures the immutable Deployment selector change with exact before/after labels.
- [ ] Flags mutable `checkout:latest` image, privileged runtime, and new `LoadBalancer` exposure.
- [ ] Explains rollback risk, owner questions, and why render-success is not release approval.
- [ ] Blocks or conditions the release with concrete safer-render requirements.
- [ ] Saves rendered diff, decision, validation output, and cleanup/no-runtime notes.

## Cleanup commands

- bash labs/platform-academy/validate-helm-release-artifact/cleanup.sh

## No-cluster fallback

- [ ] Read the before/after YAML files and complete the review without Helm.
- [ ] Block the release in writing if selector, image, security, or exposure risk is unresolved.
