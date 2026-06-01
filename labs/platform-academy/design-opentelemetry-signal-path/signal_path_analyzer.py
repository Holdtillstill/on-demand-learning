#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the OpenTelemetry signal-path packet."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def missing_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    return [f"{label} missing: {', '.join(missing)}"] if missing else []


def sum_by_labels(text: str) -> list[str]:
    match = re.search(r"sum by \(([^)]+)\)", text)
    if not match:
        return []
    return [label.strip() for label in match.group(1).split(",")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--collector", required=True, type=Path)
    parser.add_argument("--logs", required=True, type=Path)
    parser.add_argument("--rule", required=True, type=Path)
    parser.add_argument("--safe-rule", required=True, type=Path)
    parser.add_argument("--decision", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    collector = args.collector.read_text(encoding="utf-8")
    logs = args.logs.read_text(encoding="utf-8")
    rule = args.rule.read_text(encoding="utf-8")
    safe_rule = args.safe_rule.read_text(encoding="utf-8")
    decision = args.decision.read_text(encoding="utf-8")

    risky_labels = sum_by_labels(rule)
    safe_labels = sum_by_labels(safe_rule)
    valid_trace_id = re.search(r"trace_id=[0-9a-f]{32}\b", logs) is not None

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "collector.yaml",
            collector,
            [
                "http.request.header.authorization",
                "action: delete",
                "pipelines:",
                "traces:",
                "attributes/drop-sensitive",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "checkout-logs.txt",
            logs,
            ["service=checkout", "trace_id=missing", "cardinality_label=customer_email"],
        )
    )
    errors.extend(
        missing_terms(
            "signal-path-decision.md",
            decision,
            [
                "Owner Map",
                "App owner: propagate trace context",
                "Platform telemetry owner",
                "SRE owner",
                "Data/privacy owner",
                "Alert groups by route, not customer email",
            ],
        )
    )

    if not valid_trace_id:
        errors.append("checkout-logs.txt should include at least one valid trace ID for comparison")
    if "customer_email" not in risky_labels:
        errors.append("prometheus-rule.yaml should expose customer_email in alert grouping")
    if risky_labels[:2] != ["le", "route"]:
        errors.append("prometheus-rule.yaml should aggregate histogram buckets by le and route before risky labels")
    if safe_labels != ["le", "route"]:
        errors.append(f"safe-prometheus-rule.yaml should aggregate only by le and route, got {safe_labels}")
    if "customer_email" in safe_rule:
        errors.append("safe-prometheus-rule.yaml should remove customer_email")
    if "dashboard:" not in safe_rule or "severity: page" not in safe_rule:
        errors.append("safe-prometheus-rule.yaml should keep incident routing and dashboard context")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("OpenTelemetry signal path analysis passed.")
        print("- Privacy control: collector deletes http.request.header.authorization before export.")
        print("- Trace gap: checkout has a valid trace_id example and a trace_id=missing line.")
        print("- Cardinality risk: current alert groups by customer_email.")
        print("- Safer rule: alert aggregation is route-only with le buckets preserved.")
        print("- Owner map: app instrumentation, telemetry platform, SRE alerting, and data/privacy owners are named.")
        print("- Decision: fix trace propagation and alert cardinality before trusting the signal path in incidents.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
