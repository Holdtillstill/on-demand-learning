# Platform Academy canonical design implementation

## Decision

The canonical product direction is a composite, not a single visual variant:

- **Primary app shell:** the Design 7 SaaS-dashboard direction, translated into a calm product workspace with a persistent sidebar, top workspace bar, operating summary, filters, and table/list hierarchy.
- **Labs/workspace:** the Design 3 terminal/runbook direction, translated into command consoles, scenario queues, validation checklists, and evidence artifacts.
- **Resources:** the Design 10 resource-library direction, translated into a searchable artifact library with a featured resource, command snippets, domain/type filtering, and resource detail pages.
- **Observability/readiness influence:** the Design 5 critique became readiness gates, progress summaries, evidence gates, and source/review posture panels.
- **Landing influence:** the Design 1 cinematic direction was kept subtle; the production app avoids theatrical decorative panels and prioritizes utility.

The `/designs` exploration gallery and `/designs/1` through `/designs/10` remain available as reference explorations. The real product UI is now on the canonical routes.

## Changed routes

### `/` and `/dashboard/home`

Implemented a production learning dashboard:

- persistent product sidebar
- demo workspace top bar
- operating summary: readiness, curriculum, lab inventory, review state
- next-best-action panel linking lesson, lab gate, and resource artifact
- course pipeline with search, level filters, topic filters, progress state
- readiness gate rail and level coverage rail

### `/roadmap`

Reworked into a product roadmap surface:

- stage progression with course/lab/resource metrics
- outcome checklists
- level-readiness rail
- evidence and source/review posture panels

### `/labs`

Reworked into a command workspace:

- level and track filters
- lab queue list
- selected runbook panel
- dark command console
- validation checklist
- evidence artifact linkage
- detail route links

### `/labs/:slug`

Added lab detail pages:

- estimated time summary
- runbook command console
- validation checklist
- skills covered
- linked lesson
- related resources
- source/review posture note

### `/resources`

Reworked into a searchable resource library:

- resource stats
- search, domain filters, and type filters
- featured resource card with command snippets and related lab
- capped visible index: 36 shown at a time, with refinement guidance for remaining matching artifacts

This avoids dumping all 180 resources into one giant page while preserving access through filters/search.

### `/resources/:slug`

Added resource detail pages:

- command surface
- outcomes
- expected artifacts
- next steps
- prerequisites
- related labs
- inferred related courses
- source/review posture note

### `/courses/:id` and `/lessons/:id`

Reworked detail pages into the canonical workspace style:

- course progress panel
- lesson sequence
- linked lab gates
- reusable artifacts
- lesson-side related labs/resources
- source/review posture note

## Controller fixes after Codex

Codex produced the main implementation but timed out before final verification/reporting. Controller follow-up fixed:

- TypeScript error from `Map` name collision with the imported Lucide `Map` icon by using `globalThis.Map<number, Course>`.
- Updated tests to match the new canonical copy and route hierarchy.
- Course row overflow/misalignment found during browser visual QA by tightening the grid columns, constraining row overflow, and aligning arrows inside rows.
- Awkward course filter wrapping by simplifying the canonical toolbar to a single-column filter stack.
- Oversized Resources page list by limiting the initial render to 36 resources and adding a refinement note for remaining matches.

## Verification

Passed:

```bash
make fmt-check
make backend-test
cd apps/platform-academy && npm run typecheck
cd apps/platform-academy && npm test -- --run
cd apps/platform-academy && npm run build
```

Results:

- Ruff API/worker checks: passed
- Backend tests: 14 passed
- Platform Academy TypeScript: passed
- Platform Academy Vitest: 10 passed
- Platform Academy production build: passed

Container verification:

```bash
docker compose build platform-academy
docker compose up -d --force-recreate platform-academy
```

Route smoke checks returned 200:

- `/`
- `/dashboard/home`
- `/roadmap`
- `/labs`
- `/labs/trace-service-to-pod`
- `/resources`
- `/resources/linux-cheatsheet`
- `/courses/16`
- `/lessons/27`
- `/designs`
- `/designs/1`
- `/designs/3`
- `/designs/7`
- `/designs/10`

Browser QA:

- `/`: loaded with no console errors. Initial visual QA found course-row progress/arrow overflow; fixed and rechecked. The course rows are now contained and aligned.
- `/labs`: loaded with no console errors. Visual QA found no severe layout issues; command console is readable. Minor backlog: long commands wrap rather than offering copy/scroll affordances.
- `/resources`: loaded with no console errors. Initial visual QA flagged the 180-item single-column list as too large; fixed by capping to 36 visible items with filter guidance. Rechecked successfully.
- `/labs/trace-service-to-pod`: loaded with no console errors.

## Remaining backlog

- Consider a compact/table toggle for the resources page once filters become heavily used.
- Add responsive/mobile visual QA for the canonical shell beyond desktop browser checks.
