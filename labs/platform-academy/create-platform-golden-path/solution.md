# Solution: Create a Service Golden Path

## Decision

Block the starting template as incomplete for production onboarding.

## Findings

- `service-template.md` names the right artifact categories, but it does not define enough readiness gates.
- `catalog-info.yaml` has `pagerduty.com/service-id: missing`.
- `catalog-info.yaml` has `platform.example.com/slo-dashboard: missing`.
- The starting packet needs explicit secure runtime defaults, SLO target, rollback, and adoption metrics.

## Safer Target

`ready-service-template.md` defines required inputs, generated artifacts, secure defaults, first-run developer experience, and adoption metrics.

`fixed-catalog-info.yaml` fills service ownership, repository, pager, dashboard, runbook, and cost-center metadata.

## Evidence to Save

Save:

- The starting catalog metadata showing missing pager and dashboard ownership.
- The ready template excerpt that names generated artifacts and launch gates.
- The decision record explaining why the platform should block incomplete ownership metadata.
- The completed `evidence-template.md` with secure defaults, launch gates, adoption metrics, reliability metrics, and validation output.

## Cleanup

No cleanup is required for the default file-review path.
