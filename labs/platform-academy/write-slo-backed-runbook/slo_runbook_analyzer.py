#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the SLO-backed runbook packet."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def missing_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    return [f"{label} missing: {', '.join(missing)}"] if missing else []


def extract_alert_duration(text: str) -> int:
    match = re.search(r"CheckoutHighErrorBudgetBurn firing for ([0-9]+) minutes", text)
    if not match:
        fail("could not find CheckoutHighErrorBudgetBurn firing duration")
    return int(match.group(1))


def extract_rule_duration(text: str) -> str:
    match = re.search(r"^\s*for:\s*([0-9]+m)\s*$", text, re.MULTILINE)
    if not match:
        fail("could not find Prometheus rule duration")
    return match.group(1)


def extract_threshold(text: str) -> str:
    match = re.search(r">\s*([0-9.]+)", text)
    if not match:
        fail("could not find Prometheus burn threshold")
    return match.group(1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--signals", required=True, type=Path)
    parser.add_argument("--rule", required=True, type=Path)
    parser.add_argument("--runbook", required=True, type=Path)
    parser.add_argument("--decision", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    signals = args.signals.read_text(encoding="utf-8")
    rule = args.rule.read_text(encoding="utf-8")
    runbook = args.runbook.read_text(encoding="utf-8")
    decision = args.decision.read_text(encoding="utf-8")

    duration = extract_alert_duration(signals)
    rule_duration = extract_rule_duration(rule)
    threshold = extract_threshold(rule)

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "signals.md",
            signals,
            [
                "Availability: 99.9%",
                "CheckoutHighErrorBudgetBurn firing for 14 minutes",
                "43        checkout@sha256:bbbb canary 100%",
                "pods readiness flapping",
                "target group unhealthy threshold crossed",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "prometheus-rule.yaml",
            rule,
            ["CheckoutHighErrorBudgetBurn", "> 0.02", "for: 10m", "severity: page", "dashboard:"],
        )
    )
    errors.extend(
        missing_terms(
            "completed-runbook.md",
            runbook,
            [
                "Users may see failed or delayed checkout attempts",
                "kubectl rollout history deploy/checkout -n payments",
                "kubectl get events -n payments --sort-by=.lastTimestamp",
                "kubectl rollout undo deploy/checkout -n payments --to-revision=42",
                "5xx ratio falls below 2%",
                "Platform owner: add dashboard panel",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "incident-decision.md",
            decision,
            ["Collect read-only evidence first", "roll back revision 43", "Owner Split", "Incident commander", "App owner"],
        )
    )

    if duration <= 10:
        errors.append(f"alert should have fired longer than rule duration, got {duration} minutes")
    if rule_duration != "10m":
        errors.append(f"expected Prometheus rule duration 10m, got {rule_duration}")
    if threshold != "0.02":
        errors.append(f"expected 2% 5xx burn threshold as 0.02, got {threshold}")
    if "kubectl rollout undo" in runbook.split("## Safe First Commands", 1)[-1].split("## Mitigation", 1)[0]:
        errors.append("rollback command should not appear in Safe First Commands")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("SLO runbook analysis passed.")
        print("- Alert: CheckoutHighErrorBudgetBurn fired for 14 minutes against a 99.9% availability SLO.")
        print("- Burn rule: 5xx ratio above 2% for 10 minutes pages the responder.")
        print("- Correlation: revision 43 reached 100% before readiness and target-health symptoms.")
        print("- Safe first commands: rollout history, deploy describe, events, and recent logs are read-only.")
        print("- Mitigation boundary: roll back to revision 42 only if dependency traces do not dominate.")
        print("- Validation and owners: 5xx below 2%, readiness stable, target health healthy, and follow-up owners assigned.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
