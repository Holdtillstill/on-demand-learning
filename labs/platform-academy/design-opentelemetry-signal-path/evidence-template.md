# Evidence Template: Design An OpenTelemetry Signal Path

## Scope And Safety

- Collector manifest:
- Log packet:
- Prometheus rule:
- Simulator command:
- Confirmation that no live telemetry backend is changed:

## Sensitive Attribute Evidence

- Attribute being dropped:
- Processor/action:
- Why the control must remain:

## Trace Context Evidence

- Log line with trace ID:
- Log line missing trace ID:
- App instrumentation owner:
- Validation signal:

## Metric Cardinality Evidence

- Unsafe label:
- Alert expression:
- Privacy or cardinality risk:
- Safer aggregation:

## Owner Map And Handoff

- App owner:
- Telemetry/platform owner:
- SRE alert owner:
- Data/privacy owner:
- Local analyzer output:
- Evidence to save:
