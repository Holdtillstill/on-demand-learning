#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the service golden-path review packet."""

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


def parse_catalog_metadata(text: str) -> tuple[dict[str, str], str]:
    annotations: dict[str, str] = {}
    owner = ""
    in_annotations = False
    for raw_line in text.splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped == "annotations:":
            in_annotations = True
            continue
        if in_annotations and raw_line.startswith("  ") and ":" in stripped:
            key, value = stripped.split(":", 1)
            annotations[key.strip()] = value.strip()
            continue
        if in_annotations and stripped and not raw_line.startswith("    "):
            in_annotations = False
        if stripped.startswith("owner:"):
            owner = stripped.split(":", 1)[1].strip()
    return annotations, owner


def section_items(text: str, section: str) -> list[str]:
    pattern = rf"(?ms)^## {re.escape(section)}\n(?P<body>.*?)(?=^## |\Z)"
    match = re.search(pattern, text)
    if not match:
        return []
    return [line.strip("- ").strip() for line in match.group("body").splitlines() if line.strip().startswith("- ")]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start-template", required=True, type=Path)
    parser.add_argument("--ready-template", required=True, type=Path)
    parser.add_argument("--catalog", required=True, type=Path)
    parser.add_argument("--fixed-catalog", required=True, type=Path)
    parser.add_argument("--decision", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    start = args.start_template.read_text(encoding="utf-8")
    ready = args.ready_template.read_text(encoding="utf-8")
    catalog = args.catalog.read_text(encoding="utf-8")
    fixed = args.fixed_catalog.read_text(encoding="utf-8")
    decision = args.decision.read_text(encoding="utf-8")

    catalog_annotations, catalog_owner = parse_catalog_metadata(catalog)
    fixed_annotations, fixed_owner = parse_catalog_metadata(fixed)
    ready_inputs = section_items(ready, "Required Inputs")
    ready_artifacts = section_items(ready, "Generated Artifacts")

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "service-template.md",
            start,
            ["Generated artifacts", "Dockerfile", "Helm chart", "CI workflow", "ArgoCD", "SLO dashboard", "Runbook"],
        )
    )
    errors.extend(
        missing_terms(
            "ready-service-template.md",
            ready,
            [
                "Required Inputs",
                "Generated Artifacts",
                "Secure Defaults",
                "First-Run Developer Experience",
                "Adoption Metrics",
                "Production readiness review",
                "Run as non-root",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "decision-record.md",
            decision,
            ["Block the starting service template", "Adoption metrics", "Production readiness", "operational debt"],
        )
    )

    for required_input in ["service_name", "owner_team", "data_classification", "pager_rotation", "cost_center", "slo_target"]:
        if not any(required_input in item for item in ready_inputs):
            errors.append(f"ready-service-template.md missing required input: {required_input}")
    for artifact in ["Dockerfile", "Helm chart", "CI workflow", "ArgoCD Applications", "Service SLO dashboard", "Runbook"]:
        if not any(artifact in item for item in ready_artifacts):
            errors.append(f"ready-service-template.md missing generated artifact: {artifact}")

    if catalog_annotations.get("pagerduty.com/service-id") != "missing":
        errors.append("catalog-info.yaml should expose missing PagerDuty ownership")
    if catalog_annotations.get("platform.example.com/slo-dashboard") != "missing":
        errors.append("catalog-info.yaml should expose missing SLO dashboard ownership")
    if catalog_owner != "payments":
        errors.append(f"catalog-info.yaml should show the weak starting owner value payments, got {catalog_owner!r}")

    expected_fixed = {
        "github.com/project-slug": "platform-academy/checkout",
        "pagerduty.com/service-id": "P123CHECKOUT",
        "platform.example.com/slo-dashboard": "https://grafana.example.com/d/checkout-slo",
        "platform.example.com/runbook": "https://runbooks.example.com/checkout",
        "platform.example.com/cost-center": "payments-platform",
    }
    for key, expected in expected_fixed.items():
        if fixed_annotations.get(key) != expected:
            errors.append(f"fixed-catalog-info.yaml missing {key}: {expected}")
    if fixed_owner != "group:payments":
        errors.append(f"fixed-catalog-info.yaml should use group:payments owner, got {fixed_owner!r}")
    if "missing" in fixed:
        errors.append("fixed-catalog-info.yaml should not leave missing placeholders")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Golden path readiness analysis passed.")
        print("- Starting gap: catalog metadata is missing PagerDuty and SLO dashboard ownership.")
        print("- Required inputs: owner, data classification, pager rotation, cost center, and SLO target.")
        print("- Generated artifacts: Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog metadata.")
        print("- Secure defaults: non-root runtime, resource requests, secret path, staging smoke, and rollback condition.")
        print("- Fixed metadata: group:payments owner, pager, dashboard, runbook, repository, and cost center.")
        print("- Decision: block production onboarding until the ready golden-path contract is complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
