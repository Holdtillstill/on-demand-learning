#!/usr/bin/env python3
"""Evidence-oriented local ArgoCD drift analyzer for the desired/live manifest lab."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def first_match(pattern: str, text: str, label: str) -> str:
    match = re.search(pattern, text, re.MULTILINE)
    if not match:
        fail(f"could not find {label}")
    return match.group(1)


def manifest_facts(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    facts = {
        "kind": first_match(r"(?m)^kind: ([^\n]+)", text, f"{path} kind"),
        "name": first_match(r"(?m)^  name: ([^\n]+)", text, f"{path} name"),
        "namespace": first_match(r"(?m)^  namespace: ([^\n]+)", text, f"{path} namespace"),
        "replicas": first_match(r"(?m)^  replicas: ([0-9]+)", text, f"{path} replicas"),
        "image": first_match(r"(?m)^          image: ([^\n]+)", text, f"{path} image"),
        "cpu": first_match(r"(?m)^              cpu: ([^\n]+)", text, f"{path} CPU request"),
        "memory": first_match(r"(?m)^              memory: ([^\n]+)", text, f"{path} memory request"),
    }
    autoscaling_marker = "autoscaling.platform.example.com/last-scale"
    facts["autoscaling_annotation"] = autoscaling_marker if autoscaling_marker in text else ""
    return facts


def ignore_rule_facts(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    return {
        "has_ignore_differences": str("ignoreDifferences:" in text),
        "group": first_match(r"(?m)^    - group: ([^\n]+)", text, "ignore group"),
        "kind": first_match(r"(?m)^      kind: ([^\n]+)", text, "ignore kind"),
        "name": first_match(r"(?m)^      name: ([^\n]+)", text, "ignore name"),
        "namespace": first_match(r"(?m)^      namespace: ([^\n]+)", text, "ignore namespace"),
        "pointers": "\n".join(re.findall(r"(?m)^        - ([^\n]+)", text)),
        "uses_jq": str("jqPathExpressions" in text),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--desired", required=True, type=Path)
    parser.add_argument("--live", required=True, type=Path)
    parser.add_argument("--ignore-rule", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    desired = manifest_facts(args.desired)
    live = manifest_facts(args.live)
    ignore = ignore_rule_facts(args.ignore_rule)
    report = args.report.read_text(encoding="utf-8")

    errors: list[str] = []
    for field in ["kind", "name", "namespace", "image", "cpu", "memory"]:
        if desired[field] != live[field]:
            errors.append(f"{field} should remain Git-owned and equal, desired={desired[field]!r} live={live[field]!r}")
    if desired["replicas"] == live["replicas"]:
        errors.append("desired and live replicas should differ for this drift lab")
    if live["autoscaling_annotation"] == "":
        errors.append("live manifest should include autoscaling ownership evidence")
    if "/spec/replicas" not in report:
        errors.append("ArgoCD report should name /spec/replicas")
    if "selfHeal: true" not in report:
        errors.append("ArgoCD report should include selfHeal risk")
    if ignore["has_ignore_differences"] != "True":
        errors.append("ignore rule should use ignoreDifferences")
    if ignore["group"] != "apps" or ignore["kind"] != "Deployment":
        errors.append("ignore rule should target apps/Deployment")
    if ignore["name"] != desired["name"] or ignore["namespace"] != desired["namespace"]:
        errors.append("ignore rule should scope to checkout in payments")
    if ignore["pointers"].strip() != "/spec/replicas":
        errors.append(f"ignore rule should include only /spec/replicas, got {ignore['pointers']!r}")
    if ignore["uses_jq"] == "True":
        errors.append("ignore rule should avoid broad jqPathExpressions")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("ArgoCD drift analysis passed.")
        print(f"- Drift field: /spec/replicas ({desired['replicas']} desired -> {live['replicas']} live)")
        print("- Ownership signal: autoscaling.platform.example.com/last-scale")
        print(f"- Git-owned image remains: {desired['image']}")
        print(f"- Git-owned resources remain: cpu={desired['cpu']} memory={desired['memory']}")
        print("- Ignore rule is scoped to apps/Deployment checkout in payments and only /spec/replicas.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
