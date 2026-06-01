# Image Promotion Note

## Decision

Block promotion of `checkout:latest`.

## Required Evidence

- Immutable image digest, for example `registry.example.com/checkout@sha256:2222`.
- SBOM artifact attached to the build.
- Vulnerability scan result with critical and high findings reviewed.
- Runtime user set to non-root.
- No secrets in Dockerfile, image config, layer history, or build args.
- Rollback digest from the previous production release.

## Safer Runtime

`hardened.Dockerfile` keeps build work out of the runtime stage, installs production dependencies only, runs as `node`, and starts the built server directly.

## Release Note

Promote only by digest. Do not promote `latest`, do not rebuild per environment, and do not ship images that contain credentials in metadata or layer history.
