# Solution: Design a Safe Kubernetes Release Pipeline

## Decision

Block the unsafe pipeline.

## Findings

- The triage notes rule out approving the release because the build is green, because a SHA tag exists, because scans can run later, because a manual approval exists without artifacts, or because rollback has no digest-backed target.
- `deploy-prod` runs from `main` without a staging gate.
- The image is referenced by `${GITHUB_SHA}` tag only; the pipeline does not preserve or promote the immutable digest.
- There is no vulnerability scan, SBOM artifact, rendered-manifest review, schema validation, or policy check.
- Production rollout has no approval environment, canary setting, smoke test, SLO check, or rollback trigger.
- Production permissions are not separated from build and verification responsibilities.

## Safer Target

`safe-pipeline.yaml` builds and records `image-digest.txt`, scans the exact image digest, emits SBOM evidence, renders manifests, runs `kubeconform` and `conftest`, deploys to staging first, then requires production approval with canary, smoke, and rollback checks.

The local release pipeline analyzer verifies the block decision and safe gate chain without running CI:

```bash
python3 labs/platform-academy/design-safe-release-pipeline/release_pipeline_analyzer.py \
  --unsafe labs/platform-academy/design-safe-release-pipeline/pipeline.yaml \
  --safe labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml \
  --checklist labs/platform-academy/design-safe-release-pipeline/release-checklist.md \
  --decision labs/platform-academy/design-safe-release-pipeline/decision-record.md
```

Expected result: `Safe release pipeline analysis passed`, with unsafe direct production evidence, the digest-promotion gap, required gates, artifact chain, rollout chain, and block decision.

## Evidence to Save

Save:

- The unsafe pipeline excerpt showing direct production deployment.
- The safe pipeline excerpt showing digest promotion and gates.
- The decision record explaining the block decision and required contract.
- The local release pipeline analyzer output showing the artifact chain and rollout chain.
- The completed `evidence-template.md` with approval, canary, smoke, SLO rollback, and saved-artifact evidence.

## Cleanup

No cleanup is required for the default file-review path.
