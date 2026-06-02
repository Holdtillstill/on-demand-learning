# Golden Path Decision Record

## Decision

Block the starting service template as production-ready until ownership, observability, escalation, cost, secure defaults, and launch gates are explicit.

## Context

The starting template lists useful generated artifacts, but the catalog metadata still has missing PagerDuty and SLO dashboard annotations. A golden path that launches services without owners, dashboards, runbooks, and rollback expectations becomes a faster way to create operational debt.

## Required Contract

- Required inputs include owner, pager, data classification, cost center, and SLO target.
- Generated artifacts include Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog metadata.
- Secure defaults include non-root runtime, no committed secrets, resource requests, probes, and policy checks.
- Production readiness requires staging smoke evidence, rollback path, SLO alert, owner, runbook, and cost center.
- Adoption metrics must prove whether the path improves developer experience and reliability.

## Consequences

Teams get a slightly longer questionnaire, but the platform can launch services with fewer follow-up tickets and clearer production ownership.
