# Platform Academy Handoff

Use this note when taking this branch into a local demo, shared-EKS preview, or production-like deployment.

## Current Scope

- Branch: `codex/runnable-labs`.
- Platform Academy is now a full-stack product slice: API-backed catalog, standalone React frontend, guest progress/activity, workbook persistence, learner-state export/import, browser-local interview study plans, product metrics, and 21 repository-backed full labs.
- All 21 full labs now have deepened evidence templates, lab-specific worksheet prompts, validation checks, rubric items, evidence-aware API feedback terms, learner-safe artifact maps, and downloadable lab packets/workspaces.
- The cluster-backed labs include `setup --preflight` checks for `kubectl`, disposable context safety, API reachability, namespace permissions, and namespace state before mutating a local cluster. `bash labs/platform-academy/bootstrap-local-cluster.sh --preflight <lab-slug>` can create/select a disposable kind context first when kind is installed.
- Seven practical labs are flagged as portfolio-grade in the catalog and UI; their key YAML/JSON artifacts are structurally verified by `make platform-lab-artifact-contract`.
- The labs are local-first and credential-safe. AWS/EKS/Terraform-heavy labs use local fixtures, review artifacts, or explicit design-review mode instead of requiring cloud credentials.
- Production-like deployments should run Alembic separately with `CREATE_SCHEMA_ON_STARTUP=false`.

## Current Verification

Latest local verification on `codex/runnable-labs`:

- `make release-check`: passed.
- `make platform-release-check`: passed, including API-image Alembic execution and built API/web container smoke.
- `make working-tree-hygiene-check`: passed across branch changes plus local modified, staged, and untracked files.
- API tests: `59 passed`.
- Worker tests: `1 passed`.
- Zhongwen frontend tests: `1 passed`.
- Platform Academy frontend tests: `31 passed`.
- Full lab verifier: `Verified 21 full labs`.
- Lab contract now requires `DEEPENED_LAB_CONTRACT` to cover every full lab, so a future full lab cannot silently fall back to generic worksheet/rubric behavior.
- Public lab payloads are learner-safe: `artifact_paths` and `learner_artifact_paths` expose only learner inspection artifacts, not source `README.md` or `solution.md`.
- Instructor/source bundles still include the complete source artifact set and a `SOURCE-MANIFEST.txt`; built-container smoke verified all 21 source bundles reject unauthenticated requests, carry no-store headers, download with the smoke token, extract safely, and contain syntax-valid source helpers. Learner workspace bundles withhold source `README.md` and `solution.md`, carry no-store headers, extract safely, and run their local file-check validators.

## Reviewer Map

Use this map to split review by ownership area instead of reading the branch as one giant diff.

- Lab product/API: `apps/api/app/platform_content.py`, `apps/api/app/platform_lab_artifacts.py`, `apps/api/app/main.py`, `apps/api/app/schemas.py`, and `apps/api/tests/test_api.py`.
- Lab source artifacts: `labs/platform-academy/`, especially each lab `README.md`, `solution.md`, `validate.sh`, `cleanup.sh`, evidence templates, and captured evidence files.
- Platform Academy UI: `apps/platform-academy/src/App.tsx`, `apps/platform-academy/src/styles.css`, `apps/platform-academy/src/api.ts`, `apps/platform-academy/src/types.ts`, and `apps/platform-academy/src/App.test.tsx`.
- Browser smoke: `apps/platform-academy/scripts/smoke-routes.mjs`.
- Lab review matrix: `make platform-lab-matrix` prints portfolio focus and structural-gate columns so reviewers can route the seven portfolio-grade labs separately from the broader full-lab set.
- Release and contract gates: `Makefile`, `scripts/verify_platform_lab_contract.py`, `scripts/smoke_platform_academy_labs.sh`, `scripts/smoke_platform_academy_api.sh`, `scripts/smoke_platform_academy_container.sh`, `scripts/verify_api_image_migrations.sh`, `scripts/verify_workflow_contracts.py`, and `scripts/verify_k8s_platform_contract.py`.
- Deployment surface: `.env.example`, `docker-compose.yml`, `.github/workflows/`, `infra/k8s/zhongwen-platform.yaml`, and `docs/deployment.md`.

For a quick lab-by-lab review index, run:

```bash
make platform-lab-matrix
```

For a disposable reviewer/deployment bundle that includes this handoff, release evidence scaffold, lab matrix, review-scope summary, changed-file manifest, commit plan with pathspec files, content-count contract, workflow contract, PR template, git status, and diff summaries, run:

```bash
make platform-review-pack
```

## Concurrent Deployment Branch Coordination

Another deployment-focused branch can safely build on this work, but these shared surfaces need an intentional merge:

- Keep `infra/k8s/zhongwen-platform.yaml`, `docker-compose.yml`, `.env.example`, `.github/workflows/`, `Makefile`, and `docs/deployment.md` synchronized rather than accepting one side wholesale.
- Preserve the runtime contract for `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, `TRUSTED_PROXY_CIDRS`, `RATE_LIMIT_EXEMPT_PATHS`, `CREATE_SCHEMA_ON_STARTUP`, `PLATFORM_API_UPSTREAM`, `PLATFORM_SOURCE_BUNDLE_PUBLIC`, and `PLATFORM_SOURCE_BUNDLE_TOKEN`.
- Publish API and Platform Academy web images from the same Git SHA. The lab API schema, browser workbook UI, and bundle/download smoke are coupled enough that split-SHA deployment should be treated as risky.
- If the deployment branch changes hosts, image names, ingress, CORS, proxying, workflow inputs, or source-bundle token handling, rerun `make platform-release-check` after merge and run `SMOKE_DRY_RUN=true make platform-deployed-smoke API_BASE=<preview-api> WEB_BASE=<preview-web>` before the real deployed smoke.
- Do not use skip flags as evidence for this branch's first preview. They are useful for triage after the full profile has already passed once on the target environment.

## PR Opening Notes

Suggested PR summary:

- Promotes all 21 Platform Academy labs into repository-backed full labs with local-safe artifacts, validators, cleanup scripts, worksheet prompts, rubric checks, and credential-safe cloud evidence packs.
- Adds API-backed lab packets, learner workspace bundles, protected instructor/source bundles, workbook persistence/history, evidence report export, guest recovery, browser-local interview study plans, product metrics, and release smoke coverage.
- Adds release/deployment guardrails: Alembic-backed API image migration checks, Platform Academy container smoke, deployed smoke workflow, Kubernetes contract verification, environment contract checks, doc-link checks, and smoke helper validation.

Suggested PR risk note:

- This is a broad product slice touching API schema, frontend UI, lab content, smoke tooling, workflows, Docker/Kubernetes config, and docs. Review by subsystem, then use `make platform-release-check` plus deployed smoke as the integration proof.

## Required Gates

Run these before tagging, publishing images, or handing a preview URL to someone else:

```bash
make release-check
make platform-release-check
```

`make platform-release-check` includes the API image migration check and the built API/web container smoke. It should be treated as the local release candidate gate for Platform Academy image, proxy, API, frontend, lab-packet, or lab-bundle changes.

For a deployed preview or stable release, keep the full smoke profile:

```bash
make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
```

Do not use skip flags as release evidence. Skip flags are for triage after an already-known infrastructure issue.

## Deployment Assumptions

- `DATABASE_URL` points at the intended database before migrations run.
- `REDIS_URL` points at the intended Redis instance.
- `CORS_ORIGINS` includes only the preview/stable frontend origins.
- `TRUSTED_PROXY_CIDRS` includes only ingress/load-balancer peers that may supply forwarded client IP headers.
- `RATE_LIMIT_EXEMPT_PATHS` includes `/healthz`, `/readyz`, and `/metrics`.
- `PLATFORM_SOURCE_BUNDLE_TOKEN` is set for non-local deployments; `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is accepted only in local/test/development.
- Platform Academy web sets `PLATFORM_API_UPSTREAM` to the in-cluster or same-network API origin.
- API and Platform Academy web images are published from the same Git SHA.
- Kubernetes placeholder images and hosts are replaced before apply.
- Rollback notes include the previous image tag and database migration compatibility.

## Remote Smoke Setup

Before DNS or ingress is live, dry-run command wiring:

```bash
SMOKE_DRY_RUN=true make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
```

Dry-run validates origin syntax, browser smoke knobs, optional `USER_ID`, and smoke ID safety before touching the remote deployment.

For scheduled GitHub checks, set:

- `PLATFORM_API_BASE`
- `PLATFORM_WEB_BASE` when the web app uses a different origin
- `PLATFORM_SOURCE_BUNDLE_TOKEN` as a repository secret when the API protects instructor/source bundles
- `PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED=true` as a repository variable when scheduled smoke should prove unauthenticated source-bundle requests return `403`

Then enable the `platform-deployed-smoke` workflow. Manual runs can also set `source_bundle_token_required=true` for one-off protected-bundle verification. Keep the full browser profile for release evidence.

## API Contract To Preserve

The public Platform Academy learner-state contract is intentionally narrow:

- Guest profile keys: 1-80 characters; letters, numbers, dot, underscore, colon, and hyphen only.
- Activity `target_type`, `target_id`, and `state`: same safe-token character set.
- Lab workbook status: `in_progress` or `submitted`.
- Lab `artifact_paths` in `/api/platform-academy/labs` are learner-safe and must not expose source `README.md` or `solution.md`.
- Instructor/source bundles at `/api/platform-academy/labs/{slug}/bundle` include `SOURCE-MANIFEST.txt` and require `X-Platform-Source-Bundle-Token` outside local/test/development; `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is rejected outside those environments. Learner workspace bundles at `/api/platform-academy/labs/{slug}/workspace-bundle` include runnable helpers and withhold answer-key artifacts.
- Backup schema version: `1`.
- Max rows: 120 progress, 600 activity, 40 lab submissions.
- Max workbook payload: 80 worksheet fields, 160 checked fields, 100-character field keys, 4000-character answers.

API smoke verifies this contract through `/openapi.json`.

## After Verification

Clean local generated output and temporary images:

```bash
make clean-generated clean-smoke-images
```

Generate a copy-paste release evidence scaffold:

```bash
make platform-release-evidence
```

Generate a disposable reviewer/deployment handoff bundle:

```bash
make platform-review-pack
```

Attach release evidence from `make platform-release-check`, deployed smoke, `alembic current`, image tags, and the database backup/snapshot ID.
