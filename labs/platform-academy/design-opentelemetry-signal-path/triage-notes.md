# Triage Notes: OpenTelemetry Signal Path Review

## Evidence Source

These notes are a captured telemetry review packet for the OpenTelemetry signal-path lab. Use them with `collector.yaml`, `checkout-logs.txt`, `prometheus-rule.yaml`, `safe-prometheus-rule.yaml`, and `signal-path-decision.md` when no collector or telemetry backend is available.

## Timeline

- 11:10 UTC: Checkout latency alert fired, but traces and logs did not line up cleanly.
- 11:16 UTC: Collector review confirmed `http.request.header.authorization` is deleted before export.
- 11:22 UTC: Log review found one valid trace ID and one `trace_id=missing` request.
- 11:28 UTC: Alert review found `customer_email` in the histogram aggregation labels.
- 11:34 UTC: SRE review proposed route-only aggregation and explicit owners for instrumentation, collector, alerting, and privacy.
- 11:41 UTC: Signal path was marked unreliable for incident decisions until trace context and alert cardinality are fixed.

## False Leads Ruled Out

- Dropping authorization headers does not prove the whole telemetry path is privacy-safe.
- One valid trace ID does not make `trace_id=missing` acceptable for checkout incidents.
- Customer-level alert grouping is not worth the cardinality and privacy risk.
- A simulator sample does not replace an owner map for app instrumentation, collector policy, SRE alerting, and data/privacy review.
- No live backend change does not remove the need to review sensitive attributes and retention boundaries.

## Strongest Clues

- The collector has a required delete action for `http.request.header.authorization`.
- `checkout-logs.txt` shows both valid trace context and `trace_id=missing`.
- The unsafe Prometheus rule groups by `customer_email`.
- `safe-prometheus-rule.yaml` keeps histogram buckets and route aggregation but removes customer labels.
- `signal-path-decision.md` names owners for app instrumentation, telemetry platform, SRE alerting, and data/privacy.

## Evidence To Save

- Collector sensitive-attribute deletion, trace-context gap, and simulator command.
- Unsafe alert grouping, cardinality and privacy risk, safer route-only aggregation, and dashboard/runbook handoff.
- Owner map, analyzer output, validation, cleanup or no-live-backend note, and saved artifact list.
