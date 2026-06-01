# Full Lab: Design an OpenTelemetry Signal Path

## Goal

Review a telemetry path where metrics, logs, and traces disagree, then design a safer signal contract for checkout latency debugging.

## Time

45 to 60 minutes.

## Safety

No collector or telemetry backend is required. Use local manifests, logs, rules, and the simulator.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/collector.yaml
sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt
sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
python3 labs/platform-academy/simulator.py --scenario checkout-latency --format both --events 3
cp labs/platform-academy/design-opentelemetry-signal-path/evidence-template.md /tmp/otel-signal-path-evidence.md
```

## Investigation

Find:

- Which sensitive attribute is dropped.
- Where trace context is missing.
- Which metric label causes cardinality risk.
- Whether owners exist for instrumentation, collector, storage, dashboard, and alerts.

## Remediation Target

Use `signal-path-decision.md` and `safe-prometheus-rule.yaml` as the target answer.

## Validation

```bash
bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh
bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence /tmp/otel-signal-path-evidence.md
```

## Success Criteria

- You preserve sensitive-header deletion.
- You identify missing trace ID evidence.
- You remove `customer_email` from alert grouping.
- You name owners for instrumentation, collector, storage, dashboard, and alert policy.
- Your evidence note names sensitive-header deletion, missing trace context, cardinality risk, safer aggregation, owner map, validation, and saved evidence.
