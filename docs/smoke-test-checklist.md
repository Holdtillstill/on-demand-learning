# Smoke Test Checklist

Run this after every local rebuild, Docker Compose demo, shared-EKS preview, or production-like deployment.

## HTTP

- `GET /healthz` returns `200`.
- `GET /readyz` returns `200` when database and Redis are healthy.
- `make api-migration-check` passes before building or deploying API images.
- `make working-tree-hygiene-check` passes before staging or reviewing broad lab/release branches; it inspects committed branch changes plus local modified, staged, and untracked files.
- `make script-syntax-check` passes before relying on local or deployed smoke helpers.
- `make smoke-helper-check` passes before relying on deployed smoke, container smoke, API/lab smoke, review-pack, or API-image dry-run and input validation paths.
- `make terraform-validate` passes for Terraform scaffold changes; it runs fmt/init/validate only, with no plan or apply.
- `make platform-container-smoke` passes after image-affecting API, lab, nginx, or Platform Academy frontend changes; it runs the API image in production-like source-bundle protection mode and proves unauthenticated instructor/source bundle requests are blocked.
- `GET /api/platform-academy/catalog` returns `21` courses and `84` lessons.
- `make platform-api-smoke API_BASE=https://...` passes and verifies no-store API headers, the OpenAPI backup/workbook/download contract, the source-bundle token header contract, the catalog, resources, interview prep, dashboard, activity history, 21 full labs, learner-safe public artifact paths, all lab packets, instructor/source bundles, learner workspace bundles, submission persistence, submission history, platform achievements, learner state export/import, and Platform Academy product metrics.
- `make platform-lab-smoke API_BASE=https://...` passes and verifies all lab packets, protected source bundles, learner workspace bundles, no-store download headers, safe source/workspace extraction, source helper script syntax, and each downloaded workspace `validate.sh --files-only` helper.
- API lab smoke verifies every Markdown lab packet includes the guided run sequence, evidence artifact map, learner-safe artifact paths, workbook prompts, validation commands, validation checks, rubric, cleanup commands, local workspace command, and downloaded-workspace quickstart.
- `make platform-deployed-smoke API_BASE=https://... WEB_BASE=https://...` passes when validating a complete remote deployment from a workstation or CI runner.
- Container and CI browser smoke fail if the API emits `request_failed`, traceback, or unique-constraint errors while the browser is exercising lab workbook and recovery flows.
- `GET /api/platform-academy/resources` returns `320` resources.
- `GET /api/platform-academy/interview-prep` returns `22` prep packs and `219` questions.
- Academy API responses use `Cache-Control: no-store` for catalog/resources/interview/activity endpoints.

## Browser

- `make platform-browser-smoke WEB_BASE=https://...` passes against the Platform Academy web origin, including the 18 portfolio-grade lab UI signals and filter, all course, lesson, lab detail, resource detail, and interview-pack deep links, active-pack and visible-pack interview cram-sheet downloads, custom study-plan save/download, lab workbook save, lab evidence report download, guest profile export, and invalid backup import validation.
- `/dashboard/home` renders the dashboard without topbar overlap.
- `/dashboard/home` shows 21 courses, 84 lessons, 21 labs, 320 resources, and 219 interview questions.
- `/roadmap` renders all roadmap stages and remains readable on desktop and mobile widths.
- `/labs` renders lab cards and linked course/lesson actions.
- Every `/courses/{course_slug}` and `/courses/{course_slug}/lessons/{sequence}` route from the API catalog renders its title and expected lesson/progress controls.
- Every `/labs/{slug}` route from the API lab catalog renders its lab title, guided run sequence, learner-safe artifact map, workbook, learner workspace contract, packet link, learner workspace download link, downloaded-workspace filename, and extracted-bundle commands.
- `/labs/trace-service-to-pod` saves worksheet evidence and returns rubric feedback.
- Every `/resources/{slug}` route from the API resource library renders its title, commands, outcomes, and artifacts.
- Every interview pack query state under `/interview-prep?pack={slug}` renders its selected pack and full question queue.
- `/interview-prep` downloads active-pack and all-visible-packs cram sheets with pack metadata, questions, source links, and study links.
- `/interview-prep` saves a browser-local custom study plan and downloads the selected questions with related labs, resources, and source links.
- `/resources` renders dense topic filters without pushing the content awkwardly below the first viewport.
- `/interview-prep` renders horizontal prep packs and keeps selected content visible without a long scroll-back loop.
- A course page opens from the dashboard or course list.
- A lesson page opens, shows previous/next lesson navigation, and keeps lesson text readable.

## Smoke Knobs

Use environment-variable prefixes before the `make` command when a deployed smoke needs different limits or a narrower browser pass:

```bash
SMOKE_VIEWPORTS=desktop SMOKE_SKIP_WORKBOOK_FLOW=true \
  make platform-browser-smoke WEB_BASE=https://preview.academy.ybz.dev
```

- `API_BASE` points API smoke at the backend origin; `WEB_BASE` points browser smoke at the Platform Academy web origin.
- `SMOKE_DRY_RUN=true` lets `platform-api-smoke`, `platform-lab-smoke`, `platform-container-smoke`, and `platform-deployed-smoke` validate origin, smoke ID, browser smoke knobs, image/container naming, and option wiring without touching the remote deployment.
- `PLATFORM_SOURCE_BUNDLE_TOKEN` adds the instructor/source bundle token header for API and lab smoke when a non-local deployment protects `/api/platform-academy/labs/{slug}/bundle`.
- `SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED=true` makes API, lab, and deployed smoke first assert unauthenticated instructor/source bundle requests return `403`, then assert the same bundle downloads with `PLATFORM_SOURCE_BUNDLE_TOKEN`.
- The `platform-deployed-smoke` workflow reads the same token from the `PLATFORM_SOURCE_BUNDLE_TOKEN` repository secret. Set the manual `source_bundle_token_required` input or scheduled `PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED=true` repository variable to enable that protected-bundle assertion in Actions.
- `SMOKE_RUN_ID` sets the suffix used for default API/lab smoke learner IDs; by default each run uses a UTC timestamp and process ID. Keep it to letters, numbers, dot, underscore, colon, and hyphen.
- `USER_ID` can override the smoke learner ID when a stable target is useful; keep it to letters, numbers, dot, underscore, colon, and hyphen. For full API/deployed smoke, keep it to 71 characters or fewer because the recovery import check creates a `-imported` profile.
- `SMOKE_SKIP_BROWSER=true` lets `platform-deployed-smoke` run API, lab, state, and metrics smoke without Chromium during API-only triage.
- `SMOKE_INSTALL_BROWSER_DEPS=false` skips `npm ci` and `npx playwright install chromium` inside `platform-deployed-smoke` when the runner already installed them.
- `PYTHON` selects the Python runtime for API, migration, and container smoke helpers.
- `EXPECTED_COURSES`, `EXPECTED_LESSONS`, `EXPECTED_LABS`, `EXPECTED_PORTFOLIO_LABS`, `EXPECTED_RESOURCES`, `EXPECTED_INTERVIEW_PACKS`, and `EXPECTED_INTERVIEW_QUESTIONS` override API smoke and lab smoke count gates when content intentionally changes.
- `SMOKE_EXPECTED_COURSES`, `SMOKE_EXPECTED_LESSONS`, `SMOKE_EXPECTED_LABS`, `SMOKE_EXPECTED_PORTFOLIO_LABS`, `SMOKE_EXPECTED_RESOURCES`, `SMOKE_EXPECTED_INTERVIEW_PACKS`, and `SMOKE_EXPECTED_INTERVIEW_QUESTIONS` do the same for browser smoke; the browser smoke also honors the unprefixed `EXPECTED_*` names.
- `SMOKE_VIEWPORTS` defaults to `desktop,mobile` and accepts `desktop`, `mobile`, or explicit sizes like `1440x1000,390x844`.
- `SMOKE_SKIP_WORKBOOK_FLOW=true` skips the mutating workbook save and guest recovery backup flow only.
- `SMOKE_SKIP_ALL_LAB_DETAILS=true`, `SMOKE_SKIP_ALL_LEARNING_ROUTES=true`, `SMOKE_SKIP_ALL_RESOURCE_DETAILS=true`, and `SMOKE_SKIP_ALL_INTERVIEW_PACKS=true` skip the expensive Chromium render loop for those route families.
- `SMOKE_DIRECT_ROUTES=false` uses client-side navigation after the first static route; HTML deep-link checks still run.
- `SMOKE_TIMEOUT_MS`, `SMOKE_WAIT_FOR_NETWORK_IDLE=true`, and `SMOKE_FAIL_ON_CONSOLE_ERROR=true` make browser smoke stricter for slow or noisy deployments.
- `SMOKE_ARTIFACT_DIR` controls where failure screenshots and container logs are written.
- `SMOKE_SKIP_BUILD=true`, `API_IMAGE`, `WEB_IMAGE`, and `RUN_ID` let container smoke reuse already-built images. Keep `RUN_ID` to letters, numbers, dot, underscore, and hyphen.
- `CURL_CONNECT_TIMEOUT`, `CURL_MAX_TIME`, and `CURL_WAIT_MAX_TIME` bound shell smoke calls so remote deploy failures do not hang CI indefinitely.
- `API_LOG_ERROR_PATTERN` customizes the API log audit pattern; by default it fails on integrity errors, unique-constraint failures, `request_failed`, and tracebacks.

## Learner State

- A new browser profile receives a `guest-...` learner ID in local storage.
- Manual lesson completion persists progress for the current guest.
- Auto-complete after reading posts only once per lesson.
- Resource review, lab run, and interview question practice activity persists for the current guest.
- Recovery key restore switches back to the expected guest profile.
- Guest profile export downloads a JSON backup, and importing that backup restores Platform Academy lesson progress, activity, lab workbooks, and browser-local interview study plans for the active guest.
- The lab evidence report download includes the saved workbook's lab route, worksheet notes, learner artifact paths, validation commands, and rubric follow-up text.
- Starting a new profile creates a distinct learner ID without deleting previous backend rows.

## Deployment Settings

- Frontend API origin/proxy is correct for the environment.
- `CORS_ORIGINS` includes the stable and preview domains only.
- `TRUSTED_PROXY_CIDRS` includes only the ingress/load-balancer source ranges that should be allowed to set forwarded client IP headers.
- API startup rejects wildcard CORS origins, CORS entries with paths or query strings, broad rate-limit exemptions, `TRUSTED_PROXY_CIDRS` entries that trust every source address, and `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` outside local/test/development.
- `RATE_LIMIT_EXEMPT_PATHS` includes `/healthz`, `/readyz`, and `/metrics` so probes do not consume learner request budget.
- `PLATFORM_SOURCE_BUNDLE_TOKEN` is set for non-local deployments that should expose instructor/source bundles to smoke or instructor tooling; leave `PLATFORM_SOURCE_BUNDLE_PUBLIC=false` outside local/test/development.
- `DATABASE_URL` points to the intended persistent or demo database.
- `CREATE_SCHEMA_ON_STARTUP=false` is set for production-like persistent deployments where Alembic runs separately.
- `REDIS_URL` points to the intended Redis instance.
- `OTEL_EXPORTER_OTLP_ENDPOINT` is correct or intentionally empty.
- Rollback image/tag and database compatibility notes are attached to the release.
