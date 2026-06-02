#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the production EKS review packet."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def missing_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    return [f"{label} missing: {', '.join(missing)}"] if missing else []


def line_matching(text: str, pattern: str, label: str) -> str:
    for line in text.splitlines():
        if re.search(pattern, line):
            return line.strip()
    return f"{label}: missing"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--review", required=True, type=Path)
    parser.add_argument("--launch", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    review = args.review.read_text(encoding="utf-8")
    launch = args.launch.read_text(encoding="utf-8")

    worker_line = line_matching(review, r"payments/worker", "worker")
    postgres_line = line_matching(review, r"data/postgres", "postgres")
    apps_c_line = line_matching(review, r"apps-c", "apps-c")

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "cluster-review.md",
            review,
            [
                "Endpoint: public and private",
                "payments/worker   replicas=1",
                "pdb=missing",
                "volume=gp3-us-west-2a",
                "Missing cost label on apps-c",
                "No idle-request report exists",
                "Check deprecated APIs",
                "controller add-ons have no version compatibility matrix",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "launch-review.md",
            launch,
            [
                "Block production launch",
                "`payments/worker` has `pdb=missing`",
                "restore proof is required before launch",
                "`apps-c` is missing a `cost-center` label",
                "Deprecated API check",
                "Platform owner",
                "App owner",
                "Data owner",
                "FinOps owner",
                "PDB exists for every critical workload",
            ],
        )
    )

    if "cost-center=platform" in apps_c_line:
        errors.append("apps-c should be the intentionally unlabeled cost-risk node group")
    if "pdb=missing" not in worker_line:
        errors.append("payments/worker should expose the missing PDB launch blocker")
    if "spread=us-west-2a" not in worker_line:
        errors.append("payments/worker should expose single-AZ placement")
    if "gp3-us-west-2a" not in postgres_line or "restore-from-snapshot" not in postgres_line:
        errors.append("data/postgres should expose zonal storage and snapshot restore expectations")
    if "Follow-Up Improvements" not in launch:
        errors.append("launch-review.md should separate launch blockers from follow-up improvements")
    if not re.search(r"## Owners\b.*Platform owner:.*App owner:.*Data owner:.*FinOps owner:", launch, re.DOTALL):
        errors.append("launch-review.md should assign platform, app, data, and FinOps owners")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Production EKS review analysis passed.")
        print("- Decision: block production launch until reliability, cost, data recovery, and upgrade gaps are owned.")
        print("- Endpoint: public and private requires an explicit access decision before launch.")
        print("- Reliability blocker: payments/worker is single-AZ and has pdb=missing.")
        print("- Data blocker: data/postgres uses gp3-us-west-2a and needs restore proof.")
        print("- Cost blocker: apps-c lacks a cost-center label; LoadBalancer and idle-request reviews are manual or missing.")
        print("- Upgrade blocker: deprecated API output and controller add-ons compatibility matrix are missing.")
        print("- Owner split: app/workload, platform/upgrade, data recovery, and FinOps actions need validation criteria.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
