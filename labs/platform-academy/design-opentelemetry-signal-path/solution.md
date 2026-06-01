# Solution: Design an OpenTelemetry Signal Path

## Decision

Fix trace-context propagation and alert cardinality before treating telemetry as reliable incident evidence.

## Findings

- The collector correctly deletes authorization headers.
- One checkout log has `trace_id=missing`.
- The Prometheus rule groups by `customer_email`, which is high-cardinality and sensitive.
- Ownership must be split across app instrumentation, collector operations, alert quality, and privacy policy.

## Safer Target

`safe-prometheus-rule.yaml` removes `customer_email` from alert aggregation and adds labels/annotations for incident use.

`signal-path-decision.md` records the owner map and validation criteria.

The local signal-path analyzer reports `OpenTelemetry signal path analysis passed`.

## Handoff Note

A good handoff says: keep deleting `http.request.header.authorization`, fix the checkout log with `trace_id=missing`, and remove `customer_email` from the latency alert aggregation. The owner map should split app instrumentation, collector policy, SRE alert quality, dashboard links, and data/privacy decisions.

## Cleanup

No cleanup is required for the default local evidence path.
