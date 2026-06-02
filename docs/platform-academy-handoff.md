# Platform Academy Release Notes

Use this note when preparing Platform Academy for a local demo, shared Kubernetes preview, or production-like deployment.

## Current Scope

- Platform Academy is a full-stack product slice: FastAPI API, standalone React frontend, PostgreSQL, Redis, worker, browser-local guest profiles, progress/activity APIs, workbook persistence, learner-state export/import, product metrics, and repository-backed labs.
- The public static surface can show the learning product and catalog safely. API-backed progress, activity, workbook, and lab-submission flows should be treated as runtime demo behavior unless a backend is intentionally connected.
- The labs are local-first and credential-safe. AWS, EKS, Terraform, and incident-response labs use local fixtures, review artifacts, captured evidence, or explicit design-review mode instead of requiring cloud credentials.
- Production-like deployments should run Alembic separately with `CREATE_SCHEMA_ON_STARTUP=false`.

## Review Map

- Lab product/API: `apps/api/app/platform_content.py`, `apps/api/app/platform_lab_artifacts.py`, `apps/api/app/main.py`, `apps/api/app/schemas.py`, and `apps/api/tests/test_api.py`.
- Lab source artifacts: `labs/platform-academy/`, especially each lab `README.md`, `validate.sh`, `cleanup.sh`, evidence templates, and captured evidence files.
- Platform Academy UI: `apps/platform-academy/src/App.tsx`, `apps/platform-academy/src/styles.css`, `apps/platform-academy/src/api.ts`, `apps/platform-academy/src/types.ts`, and `apps/platform-academy/src/App.test.tsx`.
- Browser smoke: `apps/platform-academy/scripts/smoke-routes.mjs`.
- Deployment surface: `.env.example`, `docker-compose.yml`, `.github/workflows/`, `infra/k8s/platform-academy.yaml`, and `docs/deployment.md`.
- Release and contract gates: `Makefile`, `scripts/verify_platform_lab_contract.py`, `scripts/smoke_platform_academy_labs.sh`, `scripts/smoke_platform_academy_api.sh`, `scripts/smoke_platform_academy_container.sh`, `scripts/verify_api_image_migrations.sh`, `scripts/verify_workflow_contracts.py`, and `scripts/verify_k8s_platform_contract.py`.

For a quick lab-by-lab review index, run:

```bash
make platform-lab-matrix
```

For a disposable reviewer/deployment bundle with the release validation scaffold, lab matrix, review-scope summary, changed-file manifest, commit plan, content-count contract, workflow contract, PR template, git status, and diff summaries, run:

```bash
make platform-review-pack
```

## Required Gates

Run these before tagging, publishing images, or handing a preview URL to someone else:

```bash
make release-check
make platform-release-check
```

`make platform-release-check` includes API image migration checks and built API/web container smoke. Treat it as the local release-candidate gate for Platform Academy image, proxy, API, frontend, lab-packet, or lab-bundle changes.

For a deployed preview or stable release, keep the full smoke profile:

```bash
make platform-deployed-smoke API_BASE=https://preview.platform-academy.bozhi.dev WEB_BASE=https://preview.platform-academy.bozhi.dev
```

Skip flags are for triage after an already-known infrastructure issue; they should not be used as first-pass release evidence.

Release evidence should be captured with the command output from the current commit. Keep these checkpoints in the evidence note:

- API tests: `69 passed` when that is the current API suite result.
- Public lab payloads are learner-safe: public artifact paths match `learner_artifact_paths` and withhold source `README.md` and `solution.md`.
- Instructor/source bundles still include the complete source artifact set and a `SOURCE-MANIFEST.txt`; outside local/test/development they require `X-Platform-Source-Bundle-Token`.

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

## API Contract To Preserve

The public Platform Academy learner-state contract is intentionally narrow:

- Guest profile keys: 1-80 characters; letters, numbers, dot, underscore, colon, and hyphen only.
- Activity `target_type`, `target_id`, and `state`: same safe-token character set.
- Lab workbook status: `in_progress` or `submitted`.
- Lab `artifact_paths` in `/api/platform-academy/labs` are learner-safe and must not expose source `README.md` or `solution.md`.
- Instructor/source bundles at `/api/platform-academy/labs/{slug}/bundle` include `SOURCE-MANIFEST.txt` and require `X-Platform-Source-Bundle-Token` outside local/test/development; `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is rejected outside those environments.
- Learner workspace bundles at `/api/platform-academy/labs/{slug}/workspace-bundle` include runnable helpers and withhold answer-key artifacts.
- Backup schema version: `1`.
- Max rows: 120 progress, 600 activity, 40 lab submissions.
- Max workbook payload: 80 worksheet fields, 160 checked fields, 100-character field keys, and 4000-character answers.

API smoke verifies this contract through `/openapi.json`.

## Cleanup

Clean local generated output and temporary images after verification:

```bash
make clean-generated clean-smoke-images
```

Generate a copy-paste release validation scaffold:

```bash
make platform-release-validation
```
