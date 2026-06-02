#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the Service-to-Pod routing lab."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def document_with_kind(text: str, kind: str) -> str:
    for document in re.split(r"^---\s*$", text, flags=re.MULTILINE):
        if f"kind: {kind}" in document:
            return document
    fail(f"could not find {kind} document")


def service_selector_app(service: str) -> str:
    match = re.search(r"(?ms)^spec:\n.*?^\s+selector:\n\s+app:\s*(\S+)", service)
    if not match:
        fail("could not find Service selector app label")
    return match.group(1)


def has_term(label: str, text: str, term: str) -> list[str]:
    return [] if term in text else [f"{label} missing: {term}"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start", required=True, type=Path)
    parser.add_argument("--fixed", required=True, type=Path)
    parser.add_argument("--transcript", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    start = args.start.read_text(encoding="utf-8")
    fixed = args.fixed.read_text(encoding="utf-8")
    transcript = args.transcript.read_text(encoding="utf-8")

    start_deployment = document_with_kind(start, "Deployment")
    start_service = document_with_kind(start, "Service")
    fixed_deployment = document_with_kind(fixed, "Deployment")
    fixed_service = document_with_kind(fixed, "Service")

    start_selector = service_selector_app(start_service)
    fixed_selector = service_selector_app(fixed_service)

    errors: list[str] = []
    if start_selector != "checkout":
        errors.append(f"expected broken Service selector app=checkout, got app={start_selector}")
    if fixed_selector != "checkout-api":
        errors.append(f"expected fixed Service selector app=checkout-api, got app={fixed_selector}")

    errors.extend(has_term("start.yaml Deployment", start_deployment, "app: checkout-api"))
    errors.extend(has_term("fixed.yaml Deployment", fixed_deployment, "app: checkout-api"))
    errors.extend(has_term("fixed.yaml Service", fixed_service, "targetPort: http"))
    errors.extend(has_term("broken-evidence.txt", transcript, "Selector:          app=checkout"))
    errors.extend(has_term("broken-evidence.txt", transcript, "app=checkout-api,tier=web"))
    errors.extend(has_term("broken-evidence.txt", transcript, "ENDPOINTS"))
    errors.extend(has_term("broken-evidence.txt", transcript, "<none>"))
    errors.extend(has_term("broken-evidence.txt", transcript, "checkout   2/2"))

    if "app: checkout" not in start_service:
        errors.append("broken Service should select app=checkout")
    if "app: checkout-api" not in fixed_service:
        errors.append("fixed Service should select app=checkout-api")
    if "app: checkout-api" in start_service:
        errors.append("broken Service should not already select app=checkout-api")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Service routing analysis passed.")
        print("- Selector risk: Service checkout selects app=checkout.")
        print("- Pod label evidence: checkout Pods expose app=checkout-api,tier=web.")
        print("- EndpointSlice risk: broken state has no ready checkout backend addresses.")
        print("- Fixed target: source manifest changes the Service selector to app=checkout-api.")
        print("- Decision: update fixed.yaml, validate EndpointSlices, and clean up payments.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
