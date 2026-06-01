#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the EKS pod IP exhaustion pack."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_subnets(text: str) -> list[tuple[str, str, int]]:
    values = []
    for subnet, zone, count in re.findall(r"(subnet-[a-z0-9]+) ([a-z0-9-]+) AvailableIPv4AddressCount=([0-9]+)", text):
        values.append((subnet, zone, int(count)))
    if not values:
        fail("could not find subnet inventory")
    return values


def parse_nodes(text: str) -> list[tuple[str, int, int]]:
    values = []
    for node, max_pods, running_pods in re.findall(r"(\S+compute\.internal).*?maxPods=([0-9]+)\s+runningPods=([0-9]+)", text):
        values.append((node, int(max_pods), int(running_pods)))
    if not values:
        fail("could not find node pod-density summary")
    return values


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    text = args.snapshot.read_text(encoding="utf-8")
    subnets = parse_subnets(text)
    nodes = parse_nodes(text)
    constrained = min(subnets, key=lambda item: item[2])
    near_max = [(node, running, maximum) for node, maximum, running in nodes if running >= maximum - 1]
    has_scheduler_pressure = "FailedScheduling" in text and "Insufficient pods" in text
    has_ipam_failure = "FailedCreatePodSandBox" in text and "failed to assign an IP address" in text
    prefix_disabled = "prefix delegation disabled" in text

    errors: list[str] = []
    if not has_scheduler_pressure:
        errors.append("scheduler pod-density pressure was not found")
    if not has_ipam_failure:
        errors.append("VPC CNI IP assignment failure was not found")
    if constrained[0] != "subnet-bbb222" or constrained[2] != 7:
        errors.append(f"expected subnet-bbb222 with seven available IPs, got {constrained[0]}={constrained[2]}")
    if len(near_max) < 2:
        errors.append("expected at least two nodes at or near maxPods")
    if not prefix_disabled:
        errors.append("expected prefix delegation to be disabled")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("EKS IP exhaustion analysis passed.")
        print("- Scheduler pressure: FailedScheduling with Insufficient pods.")
        print("- VPC CNI pressure: FailedCreatePodSandBox and failed IP assignment.")
        print(f"- Most constrained subnet: {constrained[0]} in {constrained[1]} with {constrained[2]} available IPv4 addresses.")
        print(f"- Nodes near maxPods: {len(near_max)} of {len(nodes)}.")
        print("- Prefix delegation: disabled.")
        print("- Decision: pause scale-up; assign app, platform, and network owners before adding capacity.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
