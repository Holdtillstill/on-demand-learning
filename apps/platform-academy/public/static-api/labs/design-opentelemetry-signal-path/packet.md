# Design an OpenTelemetry signal path

Track: Observability
Level: Advanced
Lab tier: full
Estimated time: 55 minutes

## Scenario

Checkout latency is hard to debug because metrics, logs, and traces disagree and no one owns the telemetry path.

## Guided run sequence

1. Prepare workspace
   - No collector required; this lab reviews local OpenTelemetry and alert artifacts and can emit simulated signals.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup design-opentelemetry-signal-path
   - bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh --evidence /tmp/otel-signal-path-evidence.md
2. Investigate safely
   - Map the symptom to metrics, logs, traces, and collector ownership.
   - Find missing trace IDs and sensitive or high-cardinality labels.
   - Use the local analyzer to verify the signal path, safer alert, and owner map.
   - grep -n "authorization\|trace_id\|customer_email" labs/platform-academy/design-opentelemetry-signal-path/collector.yaml labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
3. Prove the finding
   - Collector drops authorization headers.
   - One log line has trace_id=missing.
   - The latency alert groups by customer_email, creating high cardinality risk.
   - The safe rule removes customer_email and the decision record assigns signal owners.
4. Reset or hand off
   - bash labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh
   - Use the supplied collector, log, and rule files as the telemetry path packet.
   - Write the ownership map without connecting to a telemetry backend.

## Evidence artifact map

- `labs/platform-academy/simulator.py` - Lab artifact
- `labs/platform-academy/design-opentelemetry-signal-path/collector.yaml` - Manifest
- `labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt` - Captured evidence
- `labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml` - Manifest
- `labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml` - Target artifact
- `labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md` - Decision note
- `labs/platform-academy/design-opentelemetry-signal-path/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py` - Lab artifact
- `labs/platform-academy/design-opentelemetry-signal-path/setup.sh` - Lab artifact
- `labs/platform-academy/design-opentelemetry-signal-path/validate.sh` - Self-check script
- `labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/simulator.py
- labs/platform-academy/design-opentelemetry-signal-path/collector.yaml
- labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt
- labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
- labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml
- labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md
- labs/platform-academy/design-opentelemetry-signal-path/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py
- labs/platform-academy/design-opentelemetry-signal-path/setup.sh
- labs/platform-academy/design-opentelemetry-signal-path/validate.sh
- labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh

## Worksheet prompts

- [ ] Record the collector manifest, log packet, Prometheus rule, simulator command, and confirmation that no live backend is changed.
- [ ] Paste the `http.request.header.authorization` deletion evidence and why it must remain.
- [ ] Paste the log line with a trace ID, the `trace_id=missing` line, app instrumentation owner, and validation signal.
- [ ] Paste the `customer_email` alert grouping evidence and explain the cardinality/privacy risk.
- [ ] Write the safer aggregation, owner map, dashboard/runbook handoff, and privacy decision.
- [ ] Capture analyzer output, simulator output, validation output, safe rule evidence, and saved artifacts.

## Prerequisites

- [ ] No collector required; this lab reviews local OpenTelemetry and alert artifacts and can emit simulated signals.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup design-opentelemetry-signal-path
- bash labs/platform-academy/design-opentelemetry-signal-path/setup.sh --evidence /tmp/otel-signal-path-evidence.md
- sed -n '1,220p' labs/platform-academy/design-opentelemetry-signal-path/collector.yaml
- sed -n '1,160p' labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt
- python3 labs/platform-academy/simulator.py --scenario checkout-latency --format both --events 5

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace design-opentelemetry-signal-path --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip design-opentelemetry-signal-path-learner-workspace.zip
- cd design-opentelemetry-signal-path
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Map the symptom to metrics, logs, traces, and collector ownership.
- [ ] Find missing trace IDs and sensitive or high-cardinality labels.
- [ ] Use the local analyzer to verify the signal path, safer alert, and owner map.

## Runbook commands

- grep -n "authorization\|trace_id\|customer_email" labs/platform-academy/design-opentelemetry-signal-path/collector.yaml labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
- grep -n "pipelines:\|traces:\|histogram_quantile" labs/platform-academy/design-opentelemetry-signal-path/collector.yaml labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml
- python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md

## Expected evidence

- [ ] Collector drops authorization headers.
- [ ] One log line has trace_id=missing.
- [ ] The latency alert groups by customer_email, creating high cardinality risk.
- [ ] The safe rule removes customer_email and the decision record assigns signal owners.
- [ ] The local analyzer reports OpenTelemetry signal path analysis passed.

## Validation commands

- bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh
- bash labs/platform-academy/design-opentelemetry-signal-path/validate.sh --evidence /tmp/otel-signal-path-evidence.md
- python3 labs/platform-academy/design-opentelemetry-signal-path/signal_path_analyzer.py --collector labs/platform-academy/design-opentelemetry-signal-path/collector.yaml --logs labs/platform-academy/design-opentelemetry-signal-path/checkout-logs.txt --rule labs/platform-academy/design-opentelemetry-signal-path/prometheus-rule.yaml --safe-rule labs/platform-academy/design-opentelemetry-signal-path/safe-prometheus-rule.yaml --decision labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md
- grep -n "Owner Map" labs/platform-academy/design-opentelemetry-signal-path/signal-path-decision.md

## Validation checks

- [ ] No-live-telemetry-change safety boundary recorded
- [ ] Sensitive header deletion evidence captured
- [ ] Trace context gap evidence captured
- [ ] Customer email cardinality evidence captured
- [ ] Safer aggregation and owner map written
- [ ] Signal path analyzer, simulator, and validation output captured
- [ ] Saved evidence and cleanup/no-runtime note recorded

## Rubric

- [ ] Preserves the no-live-telemetry-change safety boundary and names the reviewed artifacts.
- [ ] Keeps `http.request.header.authorization` deletion as a required collector privacy control.
- [ ] Captures trace context evidence, including a valid trace ID and `trace_id=missing` gap.
- [ ] Identifies `customer_email` as high-cardinality and sensitive alert-grouping evidence.
- [ ] Defines route-only aggregation plus app, telemetry, SRE, and data/privacy owners.
- [ ] Saves signal-path decision, safe rule, simulator output, validation output, and cleanup/no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/design-opentelemetry-signal-path/cleanup.sh

## No-cluster fallback

- [ ] Use the supplied collector, log, and rule files as the telemetry path packet.
- [ ] Write the ownership map without connecting to a telemetry backend.
