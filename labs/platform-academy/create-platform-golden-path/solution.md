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

The local golden path analyzer verifies the product-readiness decision without running a template engine:

```bash
python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py \
  --start-template labs/platform-academy/create-platform-golden-path/service-template.md \
  --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md \
  --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml \
  --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml \
  --decision labs/platform-academy/create-platform-golden-path/decision-record.md
```

Expected result: `Golden path readiness analysis passed`, with the starting gap, required inputs, generated artifacts, secure defaults, fixed metadata, and block decision.

## Evidence to Save

Save:

- The starting catalog metadata showing missing pager and dashboard ownership.
- The ready template excerpt that names generated artifacts and launch gates.
- The decision record explaining why the platform should block incomplete ownership metadata.
- The local golden path analyzer output showing fixed metadata and the block decision.
- The completed `evidence-template.md` with secure defaults, launch gates, adoption metrics, reliability metrics, and validation output.

## Cleanup

No cleanup is required for the default file-review path.
