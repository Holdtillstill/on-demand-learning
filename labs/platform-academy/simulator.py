#!/usr/bin/env python3
"""Emit deterministic local signals for Platform Academy labs."""

from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone

SCENARIOS = {
    "checkout-latency": {
        "service": "checkout",
        "route": "/checkout",
        "statuses": [200, 200, 500, 200, 503],
        "latencies": [0.18, 0.24, 1.42, 0.31, 1.87],
        "message": "checkout latency and error-budget burn sample",
    },
    "checkout-incident": {
        "service": "checkout",
        "route": "/checkout/confirm",
        "statuses": [200, 500, 500, 503, 200],
        "latencies": [0.22, 1.31, 1.74, 2.12, 0.28],
        "message": "canary incident tabletop sample",
    },
}


def emit_logs(scenario: str, events: int) -> None:
    profile = SCENARIOS[scenario]
    start = datetime(2026, 5, 31, 8, 0, tzinfo=timezone.utc)
    for index in range(events):
        status = profile["statuses"][index % len(profile["statuses"])]
        latency = profile["latencies"][index % len(profile["latencies"])]
        timestamp = start + timedelta(seconds=index * 15)
        trace_id = f"trace-{scenario}-{index:03d}"
        print(
            f"{timestamp.isoformat()} service={profile['service']} route={profile['route']} "
            f"status={status} latency_seconds={latency:.2f} trace_id={trace_id} message=\"{profile['message']}\""
        )


def emit_metrics(scenario: str, events: int) -> None:
    profile = SCENARIOS[scenario]
    status_counts: dict[int, int] = {}
    latency_sum = 0.0
    for index in range(events):
        status = profile["statuses"][index % len(profile["statuses"])]
        latency = profile["latencies"][index % len(profile["latencies"])]
        status_counts[status] = status_counts.get(status, 0) + 1
        latency_sum += latency

    for status, count in sorted(status_counts.items()):
        print(
            f'http_requests_total{{service="{profile["service"]}",route="{profile["route"]}",status="{status}"}} {count}'
        )
    print(f'http_request_duration_seconds_sum{{service="{profile["service"]}",route="{profile["route"]}"}} {latency_sum:.2f}')
    print(f'http_request_duration_seconds_count{{service="{profile["service"]}",route="{profile["route"]}"}} {events}')


def main() -> None:
    parser = argparse.ArgumentParser(description="Emit local log and metric samples for Platform Academy labs.")
    parser.add_argument("--scenario", choices=sorted(SCENARIOS), default="checkout-latency")
    parser.add_argument("--format", choices=["logs", "metrics", "both"], default="both")
    parser.add_argument("--events", type=int, default=8)
    args = parser.parse_args()

    events = max(args.events, 1)
    if args.format in {"logs", "both"}:
        emit_logs(args.scenario, events)
    if args.format == "both":
        print("---")
    if args.format in {"metrics", "both"}:
        emit_metrics(args.scenario, events)


if __name__ == "__main__":
    main()
