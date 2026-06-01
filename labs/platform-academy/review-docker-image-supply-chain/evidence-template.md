# Evidence Template: Review A Docker Image Supply Chain

## Scope And Safety

- Dockerfile:
- Captured inspect file:
- Captured history file:
- Confirmation that the unsafe secret pattern will not be reused:

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
