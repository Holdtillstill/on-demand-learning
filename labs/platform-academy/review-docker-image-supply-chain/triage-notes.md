# Triage Notes: Docker Image Promotion Review

## Evidence Source

These notes are a captured image-promotion review packet for the Docker supply-chain lab. Use them with `Dockerfile`, `image-inspect.json`, `history.txt`, `hardened.Dockerfile`, and `promotion-note.md` when Docker is not available.

## Timeline

- 16:10 UTC: Checkout image promotion was requested for `checkout:latest`.
- 16:16 UTC: Inspect metadata showed `RepoDigests` is empty, so there is no immutable promotion proof.
- 16:21 UTC: `API_TOKEN=do-not-bake-secrets` was found in the Dockerfile, image config, and layer history.
- 16:29 UTC: Runtime user was blank, which means root unless another runtime boundary overrides it.
- 16:34 UTC: The runtime stage copied `/app`, including build output and source tree.
- 16:43 UTC: Promotion was blocked until digest, SBOM, scan, non-root runtime, secret-removal, and rollback evidence are attached.

## False Leads Ruled Out

- `latest` is not acceptable promotion evidence for production even if the registry UI shows a recent push time.
- Deleting a secret in a later Dockerfile layer does not remove it from image history.
- A Kubernetes `runAsNonRoot` setting is not a replacement for a non-root image contract.
- Copying the full build tree into runtime is not harmless; it expands attack surface and leaks implementation detail.
- SBOM and vulnerability scans after promotion are too late to be a release gate.
- A rollback tag is not enough without the rollback digest.

## Strongest Clues

- `RepoTags` contains `checkout:latest` and `RepoDigests` is empty.
- `API_TOKEN=do-not-bake-secrets` appears in source Dockerfile, captured config, and layer history.
- `Config.User` is blank.
- `COPY --from=build /app .` copies more than the runtime needs.
- `hardened.Dockerfile` copies built output, installs production dependencies only, and runs as `USER node`.

## Evidence To Save

- Dockerfile, inspect, and history sources plus the no-secret-reuse safety note.
- Tag, missing digest, promotion artifact, and rollback artifact evidence.
- Secret locations, runtime user, copied-file scope, and hardened target.
- SBOM, scan, digest, rollback digest, owner, analyzer output, validation, and no-runtime note.
