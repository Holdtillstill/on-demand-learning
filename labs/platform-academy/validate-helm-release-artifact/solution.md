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

The local Helm release analyzer verifies the release decision without Helm or a cluster:

```bash
python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py \
  --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml \
  --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml \
  --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml \
  --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md
```

Expected result: `Helm release artifact analysis passed`, with selector, image, runtime, exposure, safer-target, and block-decision evidence.

The triage notes rule out render-success approval, diff-only approval, mutable-tag promotion, apply-then-fix rollback, and unapproved `LoadBalancer` exposure.

## Handoff Note

A good handoff says: `triage-notes.md` rules out render-success approval, diff-only approval, mutable-tag promotion, apply-then-fix rollback, and unapproved exposure. Block the rendered release because it changes an immutable Deployment selector, replaces a digest-pinned image with `latest`, enables privileged runtime, and introduces a `LoadBalancer`. The safer render must keep the selector stable, promote by digest, preserve non-root/non-privileged security settings, and avoid new public exposure unless separately approved.

## Evidence to Save

Save:

- The rendered before/after diff.
- The blocked-release decision.
- The local Helm release analyzer output.
- The owner questions for chart values, image promotion, security context, and Service exposure.

## Cleanup

No cleanup is required for the default file-review path.
