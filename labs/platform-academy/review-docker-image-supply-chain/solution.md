# Solution: Review a Docker Image Supply Chain

## Decision

Block the image from production promotion.

## Findings

- `image-inspect.json` shows `RepoTags: ["checkout:latest"]` and an empty `RepoDigests` list.
- `API_TOKEN=do-not-bake-secrets` appears in the Dockerfile, image config, and history.
- The runtime image does not set a non-root user.
- The runtime stage copies the build output plus source tree.
- The base image is a large generic Node image and the promotion packet has no SBOM, scan, or rollback digest evidence.

## Safer Target

`hardened.Dockerfile` separates dependency, build, and runtime stages; installs production dependencies only in runtime; copies built output; and runs as the `node` user.

`promotion-note.md` states the evidence required before production: digest, SBOM, scan result, non-root runtime, no secrets, and rollback digest.

The local Docker supply-chain analyzer verifies the block decision without Docker:

```bash
python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py \
  --dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile \
  --inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json \
  --history labs/platform-academy/review-docker-image-supply-chain/history.txt \
  --hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile \
  --promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md
```

Expected result: `Docker supply-chain analysis passed`, with promotion risk, secret leakage, blank/root runtime user, hardened target, required evidence, and the block decision.

## Handoff Note

A good handoff says: block `checkout:latest` because there is no immutable digest, `API_TOKEN=do-not-bake-secrets` appears in Dockerfile/config/history, runtime user is blank/root, and the runtime stage copies too much. Promotion needs digest, SBOM, scan result, non-root runtime, no secret metadata, and rollback digest.

## Evidence to Save

Save:

- The Dockerfile lines containing the secret and missing `USER`.
- The inspect JSON showing `checkout:latest`, empty `RepoDigests`, and blank runtime user.
- The history line showing the secret.
- The promotion note that blocks tag-only deployment.
- The local Docker supply-chain analyzer output showing the block decision.

## Cleanup

No cleanup is required for the default file-review path.
