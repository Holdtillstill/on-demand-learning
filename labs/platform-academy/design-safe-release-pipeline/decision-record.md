# Release Pipeline Decision Record

## Decision

Block the current pipeline and require a gated release contract before production deployment.

## Context

The starting pipeline deploys from `main` directly to production. It builds a tag, does not promote an immutable digest, skips image and manifest gates, skips staging, and has no smoke-test, canary, approval, or rollback boundary.

## Required Contract

- Build once and promote the exact image digest.
- Produce scan and SBOM evidence before deployment.
- Render manifests and run schema plus policy checks before deployment.
- Deploy to staging before production.
- Run smoke tests after staging and production rollout.
- Require production environment approval.
- Use canary or progressive rollout for production.
- Trigger rollback when smoke or SLO checks fail.

## Consequences

Release velocity is slightly slower, but production changes become reviewable, repeatable, and reversible.
