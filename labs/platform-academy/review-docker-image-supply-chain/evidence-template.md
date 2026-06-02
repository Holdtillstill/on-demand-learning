# Evidence Template: Review A Docker Image Supply Chain

## Scope And Safety

- Dockerfile:
- Captured inspect file:
- Captured history file:
- Confirmation that the unsafe secret pattern will not be reused:

## Triage Notes And False Leads

- Triage notes reviewed:
- False lead about `latest` freshness:
- False lead about deleted secret layers:
- False lead about runtime-only non-root controls:
- False lead about post-promotion SBOM/scan:
- False lead about rollback tag without digest:

## Tag, Digest, And Promotion Evidence

- RepoTags:
- RepoDigests:
- Promotion artifact:
- Rollback artifact:

## Secret And Runtime Evidence

- Secret in Dockerfile:
- Secret in image config:
- Secret in layer history:
- Runtime user:
- Source/build files copied into runtime:

## Hardening Decision

- Local Docker supply-chain analyzer result:
- Decision:
- Required Dockerfile changes:
- SBOM and scan evidence:
- Non-root runtime evidence:
- Owner:

## Release Handoff

- Promotion note:
- Digest to promote:
- Rollback digest:
- Validation command:
