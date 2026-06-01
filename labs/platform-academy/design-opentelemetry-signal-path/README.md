# Full Lab: Design an OpenTelemetry Signal Path

## Goal

Review a telemetry path where metrics, logs, and traces disagree, then design a safer signal contract for checkout latency debugging.

## Time

45 to 60 minutes.

## Safety

No collector or telemetry backend is required. Use local manifests, logs, rules, and the simulator.

## Starting State

```bash
bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh --evidence /tmp/otel-signal-path-evidence.md
sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/collector.yaml
sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt
sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
python3 labs/platform-academy/simulator.py --scenario checkout-latency --format both --events 3
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer or simulator by default. To exercise those from setup after you inspect the artifacts:

```bash
bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh --run-analyzer --run-simulator --evidence /tmp/otel-signal-path-evidence.md
```

## Investigation

Find:

- Which sensitive attribute is dropped.
- Where trace context is missing.
- Which metric label causes cardinality risk.
- Whether owners exist for instrumentation, collector, storage, dashboard, and alerts.

Run the local signal-path analyzer after collecting the artifacts:

```bash
python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py \
  --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml \
  --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt \
  --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml \
  --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml \
  --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md
```

## Remediation Target

Use `signal-path-decision.md` and `safe-prometheus-rule.yaml` as the target answer.

## Validation

```bash
bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh
bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence /tmp/otel-signal-path-evidence.md
python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py \
  --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml \
  --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt \
  --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml \
  --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml \
  --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md
```

## Success Criteria

- You preserve sensitive-header deletion.
- You identify missing trace ID evidence.
- You remove `customer_email` from alert grouping.
- You name owners for instrumentation, collector, storage, dashboard, and alert policy.
- Your evidence includes `OpenTelemetry signal path analysis passed`.
- Your evidence note names sensitive-header deletion, missing trace context, cardinality risk, safer aggregation, owner map, validation, and saved evidence.
