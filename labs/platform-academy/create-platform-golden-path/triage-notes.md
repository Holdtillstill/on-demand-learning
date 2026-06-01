# Triage Notes: Golden Path Product Review

## Evidence Source

These notes are a captured platform product review for the golden path lab. Use them with `service-template.md`, `ready-service-template.md`, `catalog-info.yaml`, `fixed-catalog-info.yaml`, and `decision-record.md` when no template engine or cluster is available.

## Timeline

- 10:05 UTC: A checkout service team asked to use the new service template for production onboarding.
- 10:14 UTC: Review confirmed the starting template names useful artifact categories but does not define complete readiness gates.
- 10:21 UTC: Catalog metadata showed `pagerduty.com/service-id: missing`.
- 10:24 UTC: Catalog metadata showed `platform.example.com/slo-dashboard: missing`.
- 10:31 UTC: Review found missing cost-center, runbook, secure-default, and production-readiness evidence.
- 10:40 UTC: Product launch was blocked until the ready template and fixed catalog metadata were complete.

## False Leads Ruled Out

- A template is not a golden path just because it generates many files.
- Backstage catalog presence is not ownership proof when pager, dashboard, runbook, and cost metadata are missing.
- Secure defaults cannot be delegated entirely to service teams after generation.
- A smooth first run is not enough without launch gates and measurable adoption outcomes.
- Optional metadata becomes operational debt when on-call, SLO, cost, or rollback ownership is unclear.

## Strongest Clues

- `service-template.md` lists generated artifacts but lacks a complete launch-readiness contract.
- `catalog-info.yaml` has missing PagerDuty and SLO dashboard annotations.
- `ready-service-template.md` requires owner team, data classification, pager rotation, cost center, and SLO target.
- `fixed-catalog-info.yaml` fills owner, repository, pager, dashboard, runbook, and cost center.
- `decision-record.md` blocks production onboarding until the contract is complete.

## Evidence To Save

- Required inputs, generated artifacts, secure defaults, first-run flow, and launch gates.
- Missing pager and SLO metadata, fixed owner metadata, runbook, cost center, and concrete owner.
- Analyzer output, block decision, adoption metrics, reliability metrics, validation, and no-runtime note.
