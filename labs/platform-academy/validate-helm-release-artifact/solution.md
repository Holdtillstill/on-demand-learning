# Solution: Validate a Helm Release Artifact

## Decision

Block the rendered release.

## Findings

The rendered diff introduces four serious release risks:

- The Deployment selector changes from `app.kubernetes.io/name=checkout` to `app=checkout`. For an existing Deployment, `.spec.selector` is immutable.
- The image changes from a digest-pinned reference to `registry.example.com/checkout:latest`.
- The container becomes privileged.
- A `LoadBalancer` Service is introduced, which can create cloud exposure and cost.

## Safer Target

`safe-rendered-after.yaml` keeps the selector stable, uses a digest-pinned image, keeps the container non-root and non-privileged, and exposes the Service as `ClusterIP`.

## Handoff Note

A good handoff says: block the rendered release because it changes an immutable Deployment selector, replaces a digest-pinned image with `latest`, enables privileged runtime, and introduces a `LoadBalancer`. The safer render must keep the selector stable, promote by digest, preserve non-root/non-privileged security settings, and avoid new public exposure unless separately approved.

## Evidence to Save

Save:

- The rendered before/after diff.
- The blocked-release decision.
- The owner questions for chart values, image promotion, security context, and Service exposure.

## Cleanup

No cleanup is required for the default file-review path.
