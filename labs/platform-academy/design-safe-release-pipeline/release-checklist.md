# Release Pipeline Review

Required gates:

- Build once and promote by immutable digest.
- Run unit, integration, manifest render, and policy checks before deployment.
- Scan image and attach SBOM before promotion.
- Deploy to staging before production.
- Run smoke tests after rollout.
- Define rollback criteria tied to SLO or smoke-test failure.
- Restrict production deployment permissions.

Current risk:

The sample pipeline deploys from `main` directly to production without digest promotion, scan evidence, smoke tests, canary, or approval.
