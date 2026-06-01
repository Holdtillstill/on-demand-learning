# Triage Notes: Unsafe Production Pipeline Review

## Evidence Source

These notes are a captured release-engineering review packet for the safe pipeline lab. Use them with `pipeline.yaml`, `safe-pipeline.yaml`, `release-checklist.md`, and `decision-record.md` when no CI runner, registry, or cluster is available.

## Timeline

- 18:05 UTC: The team requested approval for a faster checkout-service production deploy.
- 18:12 UTC: Review found `deploy-prod` can run from `refs/heads/main`.
- 18:18 UTC: The build path referenced a tag and recorded `missing digest promotion`.
- 18:25 UTC: No pre-production scan, SBOM, rendered manifest, schema, or policy gate was found.
- 18:31 UTC: No staging proof, smoke-test artifact, canary, SLO rollback trigger, or rollback digest was attached.
- 18:40 UTC: Release approval was blocked until the safe pipeline contract was adopted.

## False Leads Ruled Out

- A green build is not release approval when the promoted image, rendered manifests, and policy gates are missing.
- A commit SHA tag is not the same as immutable digest promotion.
- Direct deploy from `main` is not safer just because it is faster during an incident.
- Running scans after production deploy does not protect users from a bad artifact.
- A manual approval without digest, staging, smoke, and rollback evidence is ceremony, not a control.
- A rollback button is not enough without a known rollback digest and SLO trigger.

## Strongest Clues

- `deploy-prod` is gated only by `github.ref == 'refs/heads/main'`.
- The unsafe command deploys production with `helm upgrade --install checkout charts/checkout -f values/prod.yaml`.
- The unsafe pipeline records `missing digest promotion`.
- `safe-pipeline.yaml` writes `image-digest.txt`, scans the exact image, emits an SBOM, renders manifests, and runs schema and policy checks.
- Production in the safe pipeline depends on staging, approval, canary rollout, smoke tests, and `rollback-if-slo-breach`.

## Evidence To Save

- Unsafe `deploy-prod` trigger and direct Helm command.
- Digest-promotion gap and the safe `image-digest.txt` artifact chain.
- Scan, SBOM, render, schema, and policy gate evidence.
- Staging proof, production approval boundary, canary, smoke, rollback trigger, and rollback artifact.
- Analyzer output, block decision, owner split, validation, and no-runtime note.
