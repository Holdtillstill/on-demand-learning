#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the EKS cost driver evidence pack."""

from __future__ import annotations

import argparse
import csv
import sys
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Workload:
    namespace: str
    workload: str
    cpu_request_mcores: int
    cpu_usage_mcores: int
    memory_request_mib: int
    memory_usage_mib: int
    monthly_cost_usd: int
    owner: str

    @property
    def name(self) -> str:
        return f"{self.namespace}/{self.workload}"

    @property
    def cpu_ratio(self) -> float:
        if self.cpu_usage_mcores == 0:
            return float("inf")
        return self.cpu_request_mcores / self.cpu_usage_mcores

    @property
    def memory_ratio(self) -> float:
        if self.memory_usage_mib == 0:
            return float("inf")
        return self.memory_request_mib / self.memory_usage_mib

    @property
    def is_idle_unknown(self) -> bool:
        return self.owner == "unknown" and self.cpu_usage_mcores == 0 and self.memory_usage_mib == 0

    @property
    def is_over_requested(self) -> bool:
        return not self.is_idle_unknown and (self.cpu_ratio >= 4 or self.memory_ratio >= 4)


@dataclass(frozen=True)
class LoadBalancer:
    namespace: str
    name: str
    service_type: str
    age: str
    estimated_monthly_cost: int

    @property
    def full_name(self) -> str:
        return f"{self.namespace}/{self.name}"


@dataclass(frozen=True)
class PersistentVolumeClaim:
    namespace: str
    name: str
    size: str
    storage_class: str
    age: str
    owner: str

    @property
    def full_name(self) -> str:
        return f"{self.namespace}/{self.name}"


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def parse_usage(path: Path) -> list[Workload]:
    with path.open(newline="", encoding="utf-8") as handle:
        rows = [
            Workload(
                namespace=row["namespace"],
                workload=row["workload"],
                cpu_request_mcores=int(row["cpu_request_mcores"]),
                cpu_usage_mcores=int(row["cpu_usage_mcores"]),
                memory_request_mib=int(row["memory_request_mib"]),
                memory_usage_mib=int(row["memory_usage_mib"]),
                monthly_cost_usd=int(row["monthly_cost_usd"]),
                owner=row["owner"],
            )
            for row in csv.DictReader(handle)
        ]
    if not rows:
        fail("usage.csv did not contain workload rows")
    return rows


def parse_services(path: Path) -> list[LoadBalancer]:
    rows: list[LoadBalancer] = []
    for line in path.read_text(encoding="utf-8").splitlines()[1:]:
        parts = line.split()
        if not parts:
            continue
        if len(parts) != 5:
            fail(f"could not parse service row: {line}")
        namespace, name, service_type, age, cost = parts
        rows.append(LoadBalancer(namespace, name, service_type, age, int(cost)))
    if not rows:
        fail("services.txt did not contain service rows")
    return rows


def parse_storage(path: Path) -> list[PersistentVolumeClaim]:
    rows: list[PersistentVolumeClaim] = []
    for line in path.read_text(encoding="utf-8").splitlines()[1:]:
        parts = line.split()
        if not parts:
            continue
        if len(parts) != 6:
            fail(f"could not parse storage row: {line}")
        namespace, name, size, storage_class, age, owner = parts
        rows.append(PersistentVolumeClaim(namespace, name, size, storage_class, age, owner))
    if not rows:
        fail("storage.txt did not contain PVC rows")
    return rows


def parse_recommendations(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    required_terms = ["Expected Savings", "Reliability Risk", "Rollback", "Weekly: unknown owner"]
    missing = [term for term in required_terms if term not in text]
    if missing:
        fail(f"recommendations.md is missing required terms: {', '.join(missing)}")
    data_rows = [line for line in text.splitlines() if line.startswith("| ") and "---" not in line and "Finding" not in line]
    if len(data_rows) < 5:
        fail("recommendations.md should include at least five recommendation rows")
    for line in data_rows:
        columns = [column.strip() for column in line.strip("|").split("|")]
        if len(columns) != 6:
            fail(f"recommendation row should have six columns: {line}")
        finding, evidence, owner, savings, risk, rollback = columns
        if not all([finding, evidence, owner, savings, risk, rollback]):
            fail(f"recommendation row has an empty owner/savings/risk/rollback field: {line}")
    return text


def format_ratio(value: float) -> str:
    if value == float("inf"):
        return "idle"
    return f"{value:.1f}x"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--usage", required=True, type=Path)
    parser.add_argument("--services", required=True, type=Path)
    parser.add_argument("--storage", required=True, type=Path)
    parser.add_argument("--recommendations", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    workloads = parse_usage(args.usage)
    services = parse_services(args.services)
    pvcs = parse_storage(args.storage)
    parse_recommendations(args.recommendations)

    over_requested = sorted(
        [workload for workload in workloads if workload.is_over_requested],
        key=lambda workload: max(workload.cpu_ratio, workload.memory_ratio),
        reverse=True,
    )
    idle_unknown = [workload for workload in workloads if workload.is_idle_unknown]
    abandoned_lbs = [service for service in services if service.service_type == "LoadBalancer" and "abandoned" in service.name]
    abandoned_pvcs = [pvc for pvc in pvcs if "abandoned" in pvc.name or pvc.owner == "unknown"]
    architecture_review = [
        workload
        for workload in workloads
        if workload.monthly_cost_usd >= 900 and workload.owner != "unknown" and not workload.is_over_requested
    ]
    quick_win_exposure = sum(workload.monthly_cost_usd for workload in idle_unknown) + sum(
        service.estimated_monthly_cost for service in abandoned_lbs
    )

    errors: list[str] = []
    if not any(workload.name == "payments/checkout" for workload in over_requested):
        errors.append("payments/checkout should be identified as over-requested")
    if not any(workload.name == "payments/worker" for workload in over_requested):
        errors.append("payments/worker should be identified as over-requested")
    if not any(workload.name == "default/load-test" for workload in idle_unknown):
        errors.append("default/load-test should be identified as idle with unknown owner")
    if not any(service.full_name == "default/abandoned-demo" for service in abandoned_lbs):
        errors.append("default/abandoned-demo should be identified as an abandoned LoadBalancer")
    if not any(pvc.full_name == "default/abandoned-cache" and pvc.size == "200Gi" for pvc in abandoned_pvcs):
        errors.append("default/abandoned-cache should be identified as abandoned storage")
    if not any(workload.name == "observability/loki" for workload in architecture_review):
        errors.append("observability/loki should be treated as architecture review, not a quick delete")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("EKS cost driver analysis passed.")
        print(
            "- Compute right-size candidates: "
            + ", ".join(
                f"{workload.name} cpu={format_ratio(workload.cpu_ratio)} memory={format_ratio(workload.memory_ratio)}"
                for workload in over_requested
            )
            + "."
        )
        idle_summary = ", ".join(f"{workload.name} (${workload.monthly_cost_usd}/mo)" for workload in idle_unknown)
        print(f"- Idle unknown workload: {idle_summary}.")
        print(
            "- Abandoned LoadBalancers: "
            + ", ".join(f"{service.full_name} (${service.estimated_monthly_cost}/mo)" for service in abandoned_lbs)
            + "."
        )
        print("- Abandoned storage: " + ", ".join(f"{pvc.full_name} {pvc.size} {pvc.storage_class}" for pvc in abandoned_pvcs) + ".")
        print("- Architecture review, not quick delete: " + ", ".join(workload.name for workload in architecture_review) + ".")
        print(f"- Quick-win monthly exposure: ${quick_win_exposure}/mo plus abandoned storage review.")
        print("- Decision: require owner confirmation, reliability risk, rollback, and review cadence before deletion or right-sizing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
