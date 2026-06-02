# Platform Academy canonical design record

## Decision

Platform Academy now uses one canonical product shell rather than exposing separate design exploration routes. The live UI is available through the app routes for the dashboard, roadmap, labs, interview prep, resources, courses, and lessons.

The current direction is a practical operator workspace:

- **Primary app shell:** a calm product workspace with persistent navigation, a workspace bar, operating summaries, filters, and dense list/table hierarchy.
- **Labs/workspace:** command consoles, scenario queues, validation checklists, evidence artifacts, and downloadable learner workspaces.
- **Resources:** a searchable artifact library with command snippets, official references where available, domain/type filtering, and resource detail pages.
- **Readiness model:** progress summaries, lab gates, workbook state, source/review posture, and portfolio-grade evidence prompts.
- **Visual posture:** dark, restrained, technical, and command-forward. Decorative exploration concepts were retired in favor of the usable academy surface.

## Live Routes

### `/` and `/dashboard/home`

Production learning dashboard with:

- persistent product sidebar
- browser-local learner profile controls
- operating summary for readiness, curriculum, lab inventory, and interview practice
- next-best-action panel linking lessons, labs, and resources
- course pipeline with search, level filters, topic filters, and progress state

### `/roadmap`

Curriculum roadmap with:

- stage progression
- course, lab, and resource metrics
- outcome checklists
- readiness context

### `/labs`

Lab workspace with:

- runtime, level, and track filters
- lab queue
- selected lab summary
- command console
- validation checklist
- evidence artifact linkage

### `/labs/:slug`

Lab detail pages with:

- guided run sequence
- learner workspace contract
- setup, evidence, validation, and cleanup commands
- workbook and validation state
- linked lesson and related resources

### `/resources`

Resource library with:

- resource stats
- search, domain filters, and type filters
- compact resource index
- links to resource detail pages

### `/resources/:slug`

Resource detail pages with:

- command surface
- outcomes
- expected artifacts
- next steps
- prerequisites
- related labs and courses
- official links and reviewed dates where available

### `/courses/:courseRef`, `/courses/:courseRef/lessons/:sequence`, and `/lessons/:id`

Learning routes with:

- course progress
- lesson sequence
- linked lab gates
- reusable artifacts
- related labs/resources
- source and practice posture

## Retired Exploration Work

Earlier visual exploration variants informed the current shell, command workspace, resource library, and readiness model. Those exploratory routes are no longer part of the app. Unknown paths now render a dedicated Not Found page instead of silently redirecting to the dashboard.

## Verification Baseline

Use the release checks as the source of truth for the current UI:

```bash
cd apps/platform-academy
npm run typecheck
npm test -- --run
npm run build
WEB_BASE=http://127.0.0.1:5179 SMOKE_API_BASE=http://127.0.0.1:5179 SMOKE_FAIL_ON_CONSOLE_ERROR=true npm run smoke:routes
```
