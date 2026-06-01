# Design a safe Kubernetes release pipeline

Track: CI/CD
Level: Advanced
Lab tier: full
Estimated time: 55 minutes

## Scenario

A team wants push-to-prod for a Kubernetes service, and you need to add the minimum gates that protect users without blocking every release.

## Guided run sequence

1. Prepare workspace
   - No CI runner required; this lab reviews a pipeline definition and checklist.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup design-safe-release-pipeline
   - bash labs/platform-academy/design-safe-release-pipeline/setup.sh --evidence /tmp/release-pipeline-evidence.md
2. Investigate safely
   - Identify missing quality gates before production.
   - Add immutable digest promotion and smoke-test expectations.
   - Use the local analyzer to prove the unsafe path and safe gate chain.
   - Name rollback criteria and permission boundaries.
3. Prove the finding
   - The sample pipeline deploys from main directly to production.
   - The build step does not promote by digest.
   - The checklist requires scan, smoke, rollback, and approval gates.
   - The local analyzer reports Safe release pipeline analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/design-safe-release-pipeline/cleanup.sh
   - Use pipeline.yaml and release-checklist.md as the review packet.
   - Write the minimum gate set before touching a real CI system.

## Evidence artifact map

- `labs/platform-academy/design-safe-release-pipeline/pipeline.yaml` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/release-checklist.md` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/decision-record.md` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/setup.sh` - Target artifact
- `labs/platform-academy/design-safe-release-pipeline/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/design-safe-release-pipeline/validate.sh` - Self-check script
- `labs/platform-academy/design-safe-release-pipeline/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/design-safe-release-pipeline/pipeline.yaml
- labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml
- labs/platform-academy/design-safe-release-pipeline/release-checklist.md
- labs/platform-academy/design-safe-release-pipeline/decision-record.md
- labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py
- labs/platform-academy/design-safe-release-pipeline/setup.sh
- labs/platform-academy/design-safe-release-pipeline/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/design-safe-release-pipeline/validate.sh
- labs/platform-academy/design-safe-release-pipeline/cleanup.sh

## Worksheet prompts

- [ ] Record the unsafe workflow, checklist, reviewer, and confirmation that no real CI runner, registry, or cluster is being changed.
- [ ] Paste `deploy-prod`, `github.ref == 'refs/heads/main'`, direct Helm production deployment, and missing digest-promotion evidence.
- [ ] Paste the missing gate evidence and the required `image-digest.txt`, `trivy image`, SBOM, render, schema, and policy gates.
- [ ] Paste `deploy-staging`, smoke test, `environment: production`, canary, and approval boundary evidence.
- [ ] Write the release decision, owner split, rollback artifact, and `rollback-if-slo-breach` trigger.
- [ ] Capture validation output, safe pipeline excerpts, decision record, and evidence template contents to save.

## Prerequisites

- [ ] No CI runner required; this lab reviews a pipeline definition and checklist.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup design-safe-release-pipeline
- bash labs/platform-academy/design-safe-release-pipeline/setup.sh --evidence /tmp/release-pipeline-evidence.md
- sed -n '1,180p' labs/platform-academy/design-safe-release-pipeline/pipeline.yaml
- sed -n '1,180p' labs/platform-academy/design-safe-release-pipeline/release-checklist.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace design-safe-release-pipeline --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip design-safe-release-pipeline-learner-workspace.zip
- cd design-safe-release-pipeline
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Identify missing quality gates before production.
- [ ] Add immutable digest promotion and smoke-test expectations.
- [ ] Use the local analyzer to prove the unsafe path and safe gate chain.
- [ ] Name rollback criteria and permission boundaries.

## Runbook commands

- grep -n "main\|deploy-prod\|helm upgrade\|missing digest" labs/platform-academy/design-safe-release-pipeline/pipeline.yaml
- grep -n "digest\|smoke\|rollback\|approval" labs/platform-academy/design-safe-release-pipeline/release-checklist.md
- python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py --unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml --safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml --checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md --decision labs/platform-academy/design-safe-release-pipeline/decision-record.md
- diff -u labs/platform-academy/design-safe-release-pipeline/pipeline.yaml labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml || true

## Expected evidence

- [ ] The sample pipeline deploys from main directly to production.
- [ ] The build step does not promote by digest.
- [ ] The checklist requires scan, smoke, rollback, and approval gates.
- [ ] The local analyzer reports Safe release pipeline analysis passed.
- [ ] The safe pipeline adds staging, manifest validation, policy checks, canary, and rollback criteria.

## Validation commands

- bash labs/platform-academy/design-safe-release-pipeline/validate.sh
- bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence /tmp/release-pipeline-evidence.md
- python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py --unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml --safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml --checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md --decision labs/platform-academy/design-safe-release-pipeline/decision-record.md
- grep -n "environment: production" labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml

## Validation checks

- [ ] No-live-CI safety boundary recorded
- [ ] Safe release pipeline analysis passed output captured
- [ ] Direct main-to-production deploy evidence captured
- [ ] Digest-promotion gap captured
- [ ] Scan/SBOM/render/schema/policy gates captured
- [ ] Staging, smoke, approval, and canary evidence captured
- [ ] Rollback-if-SLO-breach decision recorded
- [ ] Validation output and saved evidence recorded

## Rubric

- [ ] Preserves the no-live-CI safety boundary and names the reviewed pipeline artifacts.
- [ ] Blocks `deploy-prod` from `main` and explains why tag-only promotion is weaker than digest promotion.
- [ ] Requires `image-digest.txt`, `trivy image`, SBOM, manifest render, `kubeconform`, and policy evidence before deployment.
- [ ] Requires `deploy-staging`, smoke tests, `environment: production`, approval, and canary rollout before production.
- [ ] Defines owner split, rollback artifact, and `rollback-if-slo-breach` criteria for production.
- [ ] Saves safe-pipeline excerpts, decision record, validation output, and cleanup/no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/design-safe-release-pipeline/cleanup.sh

## No-cluster fallback

- [ ] Use pipeline.yaml and release-checklist.md as the review packet.
- [ ] Write the minimum gate set before touching a real CI system.
