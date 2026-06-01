## Summary

-

## Release Evidence

Required for Platform Academy, API, persistence, deployment, lab, or frontend changes:

- [ ] `make release-check`
- [ ] `make platform-release-check` for image, proxy, Platform Academy frontend, API, or lab-bundle changes
- [ ] `make working-tree-hygiene-check` when the branch has untracked/new lab artifacts before staging
- [ ] `make api-image-migration-check` or equivalent `API_IMAGE=<published-candidate> make api-image-migration-check` for API image changes
- [ ] `make platform-api-smoke API_BASE=<origin>` for local or deployed API
- [ ] `make platform-browser-smoke WEB_BASE=<origin>` for local or deployed Platform Academy web
- [ ] `make platform-deployed-smoke API_BASE=<origin> WEB_BASE=<origin>` or the `platform-deployed-smoke` workflow with the full profile for deployed preview or stable release evidence
- [ ] Protected instructor/source bundle smoke ran with `SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true` or workflow `source_bundle_token_required=true` when the target environment protects `/api/platform-academy/labs/{slug}/bundle`
- [ ] `make clean-generated clean-smoke-images` after local verification
- [ ] `make platform-release-evidence` output attached for Platform Academy release candidates
- [ ] `make platform-review-pack` output generated for broad Platform Academy release candidates
- [ ] `content-count-contract.txt` and `workflow-contracts.txt` from the review pack are present for broad Platform Academy release candidates
- [ ] `make platform-lab-matrix` reviewed for portfolio focus, structural gate, and lab reviewer routing

## Deployment Notes

- API image tag:
- Platform Academy web image tag:
- Alembic revision from target DB:
- Backup/snapshot ID:
- Rollback image tag:
- `CORS_ORIGINS`:
- `TRUSTED_PROXY_CIDRS`:
- `RATE_LIMIT_EXEMPT_PATHS`:
- `CREATE_SCHEMA_ON_STARTUP`:
- `PLATFORM_SOURCE_BUNDLE_PUBLIC` (`false` outside local/test/development):
- Protected source-bundle smoke:
- Smoke profile used:

## Review Coordination

- Main ownership areas touched:
- Shared deployment files touched (`infra/k8s`, `docker-compose.yml`, `.env.example`, workflows, `Makefile`, docs):
- Related branch or PR that may conflict:
- Runtime contract changes reviewers should preserve:
- Skipped smoke flags, if any, and why they are not release evidence:

## Screenshots Or Smoke Output

Attach route screenshots or command output for any user-facing change:

- `/dashboard/home`
- `/labs`
- `/labs/trace-service-to-pod`
- `/resources`
- `/interview-prep`

## Risk Notes

-
