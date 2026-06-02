# OpenTelemetry Signal Path Decision

## Decision

Keep sensitive-header deletion, fix missing trace context in checkout logs, and remove user-level labels from alert aggregation.

## Evidence

- Collector deletes `http.request.header.authorization`.
- One checkout log has `trace_id=missing`.
- Current latency alert groups by `customer_email`, creating high-cardinality and privacy risk.

## Owner Map

- App owner: propagate trace context and include trace IDs in logs.
- Platform telemetry owner: collector processors, exporter health, and sensitive attribute policy.
- SRE owner: Prometheus alert shape, dashboard, and runbook link.
- Data/privacy owner: allowed attributes and retention policy.

## Validation

- Logs contain trace IDs for checkout requests.
- Alert groups by route, not customer email.
- Dashboard links metrics to logs/traces through trace ID.
- Collector still drops authorization headers.
