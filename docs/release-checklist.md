# Release Checklist

Use this checklist for tagged local demos, shared-EKS previews, and production-like Platform Academy releases.

## Pre-Release

- Confirm the branch/commit and record the Git SHA.
- Confirm no unrelated local changes are being bundled accidentally.
- Confirm image tags, database target, frontend origin, and rollback tag.
- Confirm `CORS_ORIGINS`, `TRUSTED_PROXY_CIDRS`, `DATABASE_URL`, `REDIS_URL`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `CREATE_SCHEMA_ON_STARTUP`, `RATE_LIMIT_PER_MINUTE`, `PLATFORM_SOURCE_BUNDLE_PUBLIC`, and `PLATFORM_SOURCE_BUNDLE_TOKEN`.
- Confirm `RATE_LIMIT_EXEMPT_PATHS` includes `/healthz`, `/readyz`, and `/metrics`.
- Confirm a database backup/snapshot exists before applying migrations to persistent data.

## Required Local Gates

Run before tagging or publishing images:

```bash
make release-check
```

That target expands to the required local gates:

```bash
make api-migration-check
cd apps/api && python -m ruff check app tests alembic && python -m pytest
cd apps/worker && python -m ruff check . && python -m pytest
cd apps/frontend && npm run typecheck && npm test && npm run build
cd apps/platform-academy && npm run typecheck && npm test -- --run && npm run build
make script-syntax-check
make smoke-helper-check
make doc-link-check
make env-contract-check
make platform-content-count-check
make working-tree-hygiene-check
make platform-lab-verify
make terraform-validate
make k8s-platform-contract
docker compose config --quiet
make kubeconform-check
make workflow-lint
```

`make terraform-validate` runs `terraform fmt -check`, `terraform init -backend=false`, and `terraform validate` against the scaffold without planning or applying resources.
`make workflow-lint` runs actionlint and `scripts/verify_workflow_contracts.py`, so it also proves the release-critical workflow shape: image publishing keeps migration checks, Trivy scans, built-container smoke, and delayed push ordering; the image workflow watches the smoke/image helper scripts it depends on; and the platform validation workflow keeps the local contract gates wired.
`make working-tree-hygiene-check` inspects committed branch changes plus local modified, staged, and untracked files, so newly added lab artifacts get the same whitespace, conflict-marker, generated-artifact, final-newline, and executable-shell-helper checks as tracked edits. In GitHub Actions it honors `GITHUB_BASE_REF`; set `PLATFORM_REVIEW_BASE=<ref>` locally when the release branch should compare against a target other than the default `origin/main` or `main`.

With a local API running, also run:

```bash
make platform-api-smoke API_BASE=http://localhost:8000
```

With the Platform Academy web app running behind its intended API proxy, run:

```bash
make platform-browser-smoke WEB_BASE=http://localhost:8090
```

If local web and API servers are split, pass the API origin too:

```bash
make platform-browser-smoke WEB_BASE=http://localhost:5190 API_BASE=http://localhost:8000
```

To verify the built API and Platform Academy web containers together, run:

```bash
make api-image-migration-check
make platform-container-smoke
```

Or run all local release gates plus the built-container smoke:

```bash
make platform-release-check
```

After local verification, clean generated test/build output and temporary smoke images:

```bash
make clean-generated clean-smoke-images
```

Then generate the copy-paste release note scaffold:

```bash
make platform-release-evidence
```

For reviewer routing across the full lab set, generate the lab matrix. It includes the portfolio focus and structural gate columns so reviewers can split the 8 high-value labs from the rest of the full-lab catalog:

```bash
make platform-lab-matrix
```

For the practical portfolio lab slice, run the structural artifact contract:

```bash
make platform-lab-artifact-contract
```

For a single disposable reviewer/deployment bundle with the release scaffold, lab matrix, handoff, checklist, PR template, git status, and diff summaries, generate the review pack:

```bash
make platform-review-pack
```

For a full release candidate, keep the default smoke gates: 21 courses, 84 lessons, 21 full labs, 8 portfolio-grade lab UI signals, 320 resources, 22 interview prep packs, 219 interview questions, desktop and mobile browser routes, interview cram-sheet downloads, custom study-plan save/download, workbook save, lab evidence report download, and guest recovery validation.
The lab contract also requires every full lab to expose a deepened evidence template, lab-specific workbook prompts, validation checks, rubric items, and criterion-specific evidence terms. The portfolio-grade lab subset additionally has structural checks for broken/fixed Kubernetes YAML, ArgoCD ignore rules, IAM trust and least-privilege JSON, release workflow gates, and SLO alert rules. Downloaded lab packets must include the guided run sequence and evidence artifact map before workbook prompts and commands.
The browser lab-detail smoke also requires every advertised lab route to render the guided run sequence and learner-safe artifact map before the workbook controls.

For remote triage after a known infrastructure-only change, keep API smoke full and narrow only the browser rendering pass:

```bash
make platform-api-smoke API_BASE=https://preview.academy.ybz.dev
SMOKE_VIEWPORTS=desktop \
SMOKE_SKIP_WORKBOOK_FLOW=true \
SMOKE_SKIP_ALL_RESOURCE_DETAILS=true \
SMOKE_SKIP_ALL_INTERVIEW_PACKS=true \
  make platform-browser-smoke WEB_BASE=https://preview.academy.ybz.dev
```

Do not use the narrowed browser profile as release evidence. It still verifies catalog counts and HTML deep links, but it intentionally skips some Chromium render coverage and the mutating workbook/recovery flow.

For the API image, `make api-image-migration-check` builds the API image, runs `alembic upgrade head`, `alembic current`, and `alembic check` with `CREATE_SCHEMA_ON_STARTUP=false`, and verifies the lab verifier is bundled into the image. If you are checking an already-built image, pass it explicitly:

```bash
API_IMAGE=registry.example.test/platform-academy:api-<sha> make api-image-migration-check
```

## Deploy Sequence

1. Publish API and Platform Academy web images from the same Git SHA.
2. Run `alembic upgrade head` against the target database, or run the `backend-migrations` Kubernetes Job.
3. Deploy the API with `CREATE_SCHEMA_ON_STARTUP=false` for production-like persistent databases.
4. Deploy the Platform Academy frontend with the intended API origin/proxy.
5. If using the Kubernetes scaffold, replace the API image, Platform Academy web image, secret template, and placeholder hosts before apply.
6. Confirm `/healthz`, `/readyz`, `/metrics`, and `/api/*` route to the backend through ingress, and `/` routes to the Platform Academy web service on the academy host.
7. Run deployed smoke:

```bash
make platform-api-smoke API_BASE=https://preview.academy.ybz.dev
make platform-browser-smoke WEB_BASE=https://preview.academy.ybz.dev
```

Or run both through the deployed-smoke wrapper:

```bash
make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
```

Before a preview DNS record is live, validate local command wiring without touching the remote deployment:

```bash
SMOKE_DRY_RUN=true make platform-deployed-smoke API_BASE=https://preview.academy.ybz.dev WEB_BASE=https://preview.academy.ybz.dev
SMOKE_DRY_RUN=true make platform-api-smoke API_BASE=https://preview.academy.ybz.dev
SMOKE_DRY_RUN=true make platform-lab-smoke API_BASE=https://preview.academy.ybz.dev
SMOKE_DRY_RUN=true make platform-container-smoke RUN_ID=preview-dry-run
```

The same checks can be run from GitHub Actions with `platform-deployed-smoke`; set `PLATFORM_API_BASE` and optional `PLATFORM_WEB_BASE` as repository variables for scheduled runs or pass `api_base` and `web_base` manually.
For protected source-bundle release evidence, add the `PLATFORM_SOURCE_BUNDLE_TOKEN` repository secret and either set the `PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED=true` repository variable for scheduled checks or pass `source_bundle_token_required=true` on a manual run.
Manual runs also accept `smoke_viewports`, `skip_workbook_flow`, `skip_lab_details`, `skip_learning_routes`, `skip_resource_details`, and `skip_interview_packs` inputs for non-release triage. Scripted deployed/container smoke also accepts `SMOKE_SKIP_LAB_SMOKE=true` for narrow incident triage. Keep those skip inputs off for release evidence.
API and lab smoke use a unique smoke learner ID by default; set `SMOKE_RUN_ID` or `USER_ID` only when you need stable, repeatable target rows. Keep custom IDs to letters, numbers, dot, underscore, colon, and hyphen so dry-runs catch unsafe smoke state before a deployed run mutates anything. Full API/deployed smoke appends `-imported` during recovery validation, so keep `USER_ID` to 71 characters or fewer. Set `PLATFORM_SOURCE_BUNDLE_TOKEN` for smoke runs against non-local APIs that protect instructor/source bundles, and set `SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true` when release evidence should prove unauthenticated bundle requests return `403` before token-authenticated downloads pass.

## Acceptance Evidence

Attach these to the release note:

- Git SHA and image tags.
- `alembic current` output for the target database.
- `make platform-api-smoke API_BASE=...` output, including no-store header validation and OpenAPI backup, workbook, source-bundle token, and download response-header contract validation.
- `make platform-browser-smoke WEB_BASE=...` output, proving the 8 portfolio-grade lab UI signals and filter, core routes plus every advertised course, lesson, lab detail, resource detail, and interview-pack route render in Chromium, and proving the browser can download interview cram sheets, save/download a custom study plan, save a lab workbook, download the resulting lab evidence report, and validate guest recovery backup controls.
- `make platform-container-smoke` output, proving the built API image serves the full API smoke and full lab smoke in a production-like `ENVIRONMENT=preview` mode, all lab packets and learner workspace bundles are downloadable with no-store headers, every workspace extracts safely and runs `validate.sh --files-only`, instructor/source bundles reject unauthenticated requests with no-store headers, download with the smoke token, extract safely, contain syntax-valid source helpers, the Platform Academy nginx image works with that API, and the API log stays free of request failures, tracebacks, and unique-constraint errors during smoke.
- Backup/snapshot identifier and rollback image tag.

## Public API Contract

The deployed API should expose the Platform Academy recovery and lab workbook contract through `/openapi.json`:

- `GET /api/platform-academy/state/{user_id}/export`
- `POST /api/platform-academy/state/import`
- `GET /api/platform-academy/lab-submissions/{user_id}`
- `POST /api/platform-academy/labs/{lab_slug}/submission`
- `GET /api/platform-academy/labs/{lab_slug}/bundle`
- `GET /api/platform-academy/labs/{lab_slug}/workspace-bundle`

The contract should keep the learner-state limits documented in `docs/platform-academy.md`: 1-80 character guest profile keys, safe-token activity fields, `in_progress`/`submitted` lab statuses, 120 progress rows, 600 activity rows, 40 lab submissions, 80 worksheet fields, 160 checked fields, 100-character field keys, 4000-character worksheet answers, and schema version 1.
Public lab `artifact_paths` should remain learner-safe and match `learner_artifact_paths`. Instructor/source bundles should keep `SOURCE-MANIFEST.txt` plus the complete source artifact set, including source `README.md` and `solution.md`; outside local/test/development they should require `X-Platform-Source-Bundle-Token`, and `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` should be rejected at API startup. Learner workspace bundles should withhold those source-only artifacts.

## Rollback

- Roll back the app image tag only if it remains compatible with the current Alembic revision.
- Prefer forward fixes for schema issues after a migration has touched persistent data.
- Keep the pre-release database snapshot until smoke checks and stakeholder review pass.
