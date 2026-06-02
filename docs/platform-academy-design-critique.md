# Platform Academy design critique

## Purpose

This note preserves the product design lessons that informed Platform Academy. It no longer describes live exploration routes; the application now exposes the canonical academy workspace, lab, interview, resource, course, and lesson routes.

## Comparable Product Signals

The design benchmark looked at learning platforms, official documentation hubs, and technical product surfaces for cloud, DevOps, Kubernetes, SRE, and platform engineering learners:

1. KodeKloud
2. Pluralsight / A Cloud Guru
3. AWS Skill Builder / Cloud Quest
4. Google Cloud Skills Boost
5. Microsoft Learn
6. HashiCorp Developer
7. Grafana Labs docs and learning content
8. Datadog Learning Center and docs
9. Docker Docs / Get Started
10. Kubernetes docs and training ecosystem
11. Educative
12. Linear, Vercel, and Tailwind UI product surfaces

## Lessons Applied

- **Credibility beats decoration.** Senior platform learners need visible course depth, labs, runbooks, artifacts, domain coverage, and source posture.
- **Command surfaces matter.** Kubernetes/SRE/cloud training feels more legitimate when snippets, validation commands, and runbook artifacts are visible.
- **Labs need duration and verification.** Learners should see time, prerequisites, outcomes, and success criteria before starting.
- **Progress and readiness cues improve orientation.** Progress, completed counts, readiness, and evidence gates help the app feel like a real product rather than a static content gallery.
- **Resource libraries should be searchable artifacts.** Cheatsheets, runbooks, worksheets, project briefs, interview prep, official references, and diagrams need domain/type structure.
- **Official-source posture is a trust signal.** Resource pages should preserve source links, review dates, version context, and limitations where available.
- **Avoid empty decorative panels.** Technical product surfaces should carry data, commands, labels, or interactions.
- **Responsive command/code treatment is non-negotiable.** Long commands and checklist lines must wrap or scroll cleanly without clipping.

## Canonical Direction

The current product combines the useful parts of earlier exploration work:

- a restrained SaaS-style shell for navigation and learning state
- a terminal/runbook-informed lab workspace
- a searchable resource library with operational artifacts
- readiness and evidence gates inspired by SRE review workflows
- a dark technical visual system that prioritizes readability and repeated use

Exploration-only routes were retired. Current public verification should focus on the canonical app routes and the release smoke checks.

## Current Verification Baseline

```bash
cd apps/platform-academy
npm run typecheck
npm test -- --run
npm run build
WEB_BASE=http://127.0.0.1:5179 SMOKE_API_BASE=http://127.0.0.1:5179 SMOKE_FAIL_ON_CONSOLE_ERROR=true npm run smoke:routes
```

The smoke suite verifies the main academy routes at desktop and mobile viewport sizes, lab detail routes, course and lesson routes, resource detail routes, interview prep packs, workbook save/recovery flows, and browser download paths.
