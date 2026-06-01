#!/usr/bin/env python3
"""Local Terraform plan risk analyzer for the EKS plan review lab."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def first_match(pattern: str, text: str, label: str) -> str:
    match = re.search(pattern, text, re.MULTILINE | re.DOTALL)
    if not match:
        fail(f"could not find {label}")
    return match.group(1)


def subnet_list(raw: str) -> list[str]:
    return re.findall(r'"([^"]+)"', raw)


def analyze_plan(path: Path) -> dict[str, object]:
    text = path.read_text(encoding="utf-8")
    before_subnets = subnet_list(first_match(r"~ subnet_ids\s+=\s+(\[[^\]]+\])\s+->", text, "old subnet list"))
    after_subnets = subnet_list(first_match(r"~ subnet_ids\s+=\s+\[[^\]]+\]\s+->\s+(\[[^\]]+\])", text, "new subnet list"))
    desired_before, desired_after = re.search(r"desired_size = ([0-9]+) -> ([0-9]+)", text).groups()  # type: ignore[union-attr]
    max_before, max_after = re.search(r"max_size\s+= ([0-9]+) -> ([0-9]+)", text).groups()  # type: ignore[union-attr]
    summary_match = re.search(r"Plan: ([0-9]+) to add, ([0-9]+) to change, ([0-9]+) to destroy\.", text)
    if summary_match is None:
        fail("could not find Terraform plan summary")
    return {
        "replacement": "must be replaced" in text,
        "resource": first_match(r"# ([^\n]+) must be replaced", text, "replacement resource"),
        "before_subnets": before_subnets,
        "after_subnets": after_subnets,
        "desired_before": int(desired_before),
        "desired_after": int(desired_after),
        "max_before": int(max_before),
        "max_after": int(max_after),
        "public_ingress": "0.0.0.0/0" in text,
        "broad_iam": 'Action   = "eks:*"' in text and 'Resource = "*"' in text,
        "summary": tuple(int(value) for value in summary_match.groups()),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--plan", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    facts = analyze_plan(args.plan)
    risks: list[str] = []
    if facts["replacement"]:
        risks.append(f"replacement: {facts['resource']}")
    if len(facts["after_subnets"]) < len(facts["before_subnets"]):
        risks.append(
            "subnet coverage regression: "
            f"{','.join(facts['before_subnets'])} -> {','.join(facts['after_subnets'])}"
        )
    if facts["desired_after"] < facts["desired_before"] or facts["max_after"] < facts["max_before"]:
        risks.append(
            "capacity reduction during replacement: "
            f"desired {facts['desired_before']} -> {facts['desired_after']}, "
            f"max {facts['max_before']} -> {facts['max_after']}"
        )
    if facts["public_ingress"]:
        risks.append("public ingress: 0.0.0.0/0 on 443")
    if facts["broad_iam"]:
        risks.append("broad IAM: eks:* on *")
    add, change, destroy = facts["summary"]
    if destroy:
        risks.append(f"plan destroys resources: {destroy} destroy action(s)")

    if not risks:
        print("FAIL: expected blocking Terraform plan risks were not found", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Terraform plan risk analysis passed.")
        print(f"- Decision: Do not approve ({len(risks)} blocking risk signals).")
        print(f"- Plan summary: {add} to add, {change} to change, {destroy} to destroy.")
        for risk in risks:
            print(f"- {risk}")
        print("- Required response: split risky changes, preserve multi-AZ capacity, restrict ingress, scope IAM, add rollback.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
