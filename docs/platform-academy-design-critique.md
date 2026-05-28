# Platform Academy design critique

## Comparable products researched

This critique benchmarked the `/designs` exploration routes against learning platforms, official documentation hubs, and premium SaaS/product surfaces that target cloud, DevOps, Kubernetes, SRE, or technical professionals.

1. **KodeKloud** — strong hands-on lab promise, certification-oriented paths, and clear outcomes for DevOps/Kubernetes learners.
2. **Pluralsight / A Cloud Guru** — skill paths, assessments, enterprise trust cues, and progress-oriented cloud learning funnels.
3. **AWS Skill Builder / Cloud Quest** — official-source credibility, role-based learning plans, labs, badges, and exam alignment.
4. **Google Cloud Skills Boost** — quest structure, lab duration, badges, prerequisites, and source-backed cloud training modules.
5. **Microsoft Learn** — module paths, progress state, prerequisites, sandboxes, role/product filters, and dense but navigable docs UX.
6. **HashiCorp Developer** — high-trust docs/learn IA, command snippets, tutorials, product filters, and practitioner-focused copy.
7. **Grafana Labs docs/learning** — observability-first hierarchy, screenshots, runbooks, dashboards, and direct operational workflows.
8. **Datadog Learning Center/docs** — enterprise credibility, product-domain filtering, observability scenarios, and applied workflows.
9. **Docker Docs / Get Started** — concise task sequencing, command-first teaching, copyable snippets, and beginner-to-advanced transitions.
10. **Kubernetes docs/training ecosystem** — official reference posture, task/tutorial/concept separation, and version/source authority.
11. **Educative** — interactive lesson flow, embedded practice, progress, and outcome-oriented paths.
12. **Linear / Vercel / Tailwind UI design inspiration** — restrained hierarchy, premium information density, and credible modern SaaS polish.

## UX lessons extracted

- **Credibility beats decoration.** Senior platform learners need proof that the academy has real curriculum depth: course counts, lesson counts, labs, runbooks, artifacts, domain coverage, and source-freshness posture.
- **Command surfaces matter.** Kubernetes/SRE/cloud training feels more legitimate when code snippets, `kubectl` commands, validation checks, and runbook-style artifacts are visible in the UI.
- **Labs need duration and verification.** Strong learning platforms make lab time, prerequisites, outcomes, and success criteria visible before a learner commits.
- **Progress and readiness cues improve conversion.** Progress %, XP, completed counts, readiness scores, and assessment gates help the app feel like a product rather than a static gallery.
- **Resource libraries should be searchable artifacts, not blog piles.** Cheatsheets, runbooks, worksheets, project briefs, interview prep, official references, and diagrams need domain/type structure.
- **Official-source posture is a trust signal.** Even if this local MVP does not ship live citations everywhere, designs should reserve space for source links, review dates, version context, and limitations.
- **Distinct concepts are useful only if they preserve product semantics.** Visual variants should stay visually different, but all need to show the same durable product truth: tracks, labs, commands, artifacts, and learner progress.
- **Avoid empty decorative blocks.** Blank terminal/graph/gradient panels read as broken UI in technical products. Every panel should carry data, commands, labels, or an interaction affordance.
- **Responsive command/code treatment is non-negotiable.** Long commands and checklist lines must wrap or scroll cleanly without clipping.

## Ranked critique of the 10 design routes

### 1. `/designs/7` — Premium SaaS Dashboard

**Verdict:** strongest candidate for canonical admin/cohort product surface.

- **Strengths:** credible product-shell posture, dense but readable KPIs, clear SaaS hierarchy, and strong fit for cohort planning or academy operations.
- **Must-fix addressed:** added evidence gates and reusable artifact rows so the page no longer feels like generic dashboard furniture.
- **Should-fix later:** add filter controls, cohort selection, and drill-down states if it becomes the real app shell.

### 2. `/designs/3` — Terminal Ops Cockpit

**Verdict:** strongest portfolio signal for DevOps/SRE authenticity.

- **Strengths:** command-first concept fits CLI-native Kubernetes learners; terminal metaphor is domain-appropriate.
- **Must-fix addressed:** preserved the previous signal panel fix and added verification gates so the page shows actual lab success criteria instead of decorative terminal blocks.
- **Should-fix later:** tune the oversized hero copy on smaller desktop widths and add copy buttons for commands.

### 3. `/designs/10` — Resource Magazine Library

**Verdict:** strongest for SEO/content/resource-library direction.

- **Strengths:** maps well to a public, indexable resource library with runbooks, cheatsheets, official references, and project briefs.
- **Must-fix addressed:** added command snippets and related-lab linkage to the featured resource so it feels operational, not just editorial.
- **Should-fix later:** add domain/type filters and visible source/review metadata within the variant itself.

### 4. `/designs/5` — Observability Wall

**Verdict:** high-fit visual metaphor for SRE learning.

- **Strengths:** monitoring-wall concept aligns with RED/USE metrics, incident review, runbooks, and reliability learning.
- **Must-fix addressed:** added lab/runbook proof so the telemetry wall ties to practice, not only visual atmosphere.
- **Should-fix later:** add realistic dashboard states, alert severity legend, and trace/log/source links.

### 5. `/designs/1` — Cinematic Cloud Control Room

**Verdict:** strong first-impression/landing candidate.

- **Strengths:** dramatic launch-room mood and mission language create a memorable academy brand.
- **Must-fix addressed:** added proof strip and current drill panel so the cinematic shell has concrete learning substance.
- **Should-fix later:** make the hero CTA path clearer if used as a public landing page.

### 6. `/designs/6` — Infra Blueprint

**Verdict:** good for architecture/rubric pages.

- **Strengths:** blueprint metaphor fits infrastructure progression, diagrams, design reviews, and platform rubrics.
- **Must-fix addressed:** added spec bullets for lesson-linked labs, reusable artifacts, and sandbox-safe AWS posture.
- **Should-fix later:** add diagram legends and architecture artifact download affordances.

### 7. `/designs/9` — Certification Bootcamp

**Verdict:** commercially understandable, but risks feeling generic unless tied to hands-on labs.

- **Strengths:** clear outcome framing and assessment mood.
- **Must-fix addressed:** added timed assessment and reusable artifact panels to connect certification practice with real operational drills.
- **Should-fix later:** add explicit exam domain mapping, readiness rubric, and scored practice states.

### 8. `/designs/4` — Glass Cloud Atlas

**Verdict:** attractive explorer concept; better as navigation/discovery than conversion.

- **Strengths:** track map and cloud-native waypoint framing are visually distinct.
- **Must-fix addressed:** added proof strip and map waypoint lab panel.
- **Should-fix later:** make waypoints interactive with clear selected-state and prerequisite chains.

### 9. `/designs/8` — Command Center Map

**Verdict:** visually differentiated, but needs clearer learner decision flow.

- **Strengths:** route/map metaphor can make curriculum feel deployable across domains.
- **Must-fix addressed:** added lab scenario details and proof strip.
- **Should-fix later:** reduce visual density and add a clearer primary next action.

### 10. `/designs/2` — Editorial Academy

**Verdict:** polished but least distinct as a technical training product unless it becomes a publication/content route.

- **Strengths:** refined reading experience and good fit for deep essays, case studies, or platform judgment articles.
- **Must-fix addressed:** added source-posture note and proof strip to reduce generic editorial feel.
- **Should-fix later:** add article metadata, source links, review dates, and stronger ties from essays into labs.

## Implemented changes

- Added shared **Academy proof points** across the design routes: curriculum count, sequenced lessons, lab count/average duration, resource count/domain coverage, readiness/progress, and XP.
- Added `/designs` **research lens** cards that state the benchmarked product bar and make the design exercise less arbitrary.
- Added reusable design support components:
  - `DesignEvidenceStrip`
  - `DesignLabBrief`
  - `DesignResourceBrief`
  - `averageLabMinutes`
  - `firstResourceForLab`
- Strengthened variants with practical learning/product substance:
  - current drill panel in Control Room
  - source-posture note in Editorial Academy
  - verification gates in Terminal Ops Cockpit
  - map waypoint lab in Glass Cloud Atlas
  - runbook drill in Observability Wall
  - sandbox/spec bullets in Infra Blueprint
  - evidence gates in Premium SaaS Dashboard
  - lab scenarios in Command Center Map
  - timed assessment in Certification Bootcamp
  - command snippet + related lab in Resource Magazine Library
- Renamed the resources page eyebrow from implementation/process language (`Codex gap audit`) to user-facing product language (`Runbooks, projects, rubrics, references`).
- Added tests for the new research/proof content and terminal verification surface.
- Added responsive CSS for proof strips, research notes, command/lab panels, and evidence rows.

## Remaining backlog

- Add visible source links, review dates, and version-context metadata to lesson/resource/design surfaces.
- Add command copy buttons and command output examples to lab-heavy variants.
- Add real interaction states for selected tracks, labs, filters, and route-map waypoints.
- Add mobile-specific visual QA for all 10 variants, especially long command/checklist wrapping.
- If choosing a canonical direction, combine `/designs/7` product shell + `/designs/3` command authenticity + `/designs/10` resource depth rather than picking a pure visual skin.
- Add screenshot/regression testing if the design gallery continues to grow.

## Verification

Codex attempted to start local API/frontend dev servers inside its sandbox, but socket binding was blocked with `EPERM` on localhost. Controller verification was then completed outside the Codex sandbox.

Passed locally:

```bash
cd apps/platform-academy && npm run typecheck
cd apps/platform-academy && npm test -- --run
cd apps/platform-academy && npm run build
```

Results:

- TypeScript: passed
- Vitest: 10 passed
- Vite production build: passed

Container/live smoke verification:

```bash
docker compose build platform-academy
docker compose up -d --force-recreate platform-academy
for path in /designs /designs/1 /designs/2 /designs/3 /designs/4 /designs/5 /designs/6 /designs/7 /designs/8 /designs/9 /designs/10; do
  curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:8090$path"
done
```

Results:

- `/designs`: 200
- `/designs/1` through `/designs/10`: 200

Browser QA:

- `/designs`: loaded, no console errors.
- `/designs/3`: loaded, no console errors; visual inspection found no clipped panels, overlap, empty blocks, or unreadable text. Minor watch-out: dense headline/checklist wrapping, still readable.
- `/designs/10`: loaded, no console errors; visual inspection found the new command snippet and related-lab text contained cleanly with no broken spacing.
