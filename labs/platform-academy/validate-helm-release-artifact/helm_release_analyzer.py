#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the rendered Helm release packet."""

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


def first_image(deployment: str) -> str:
    match = re.search(r"^\s*image:\s*(\S+)\s*$", deployment, re.MULTILINE)
    if not match:
        fail("could not find deployment image")
    return match.group(1)


def has_term(label: str, text: str, term: str) -> list[str]:
    return [] if term in text else [f"{label} missing: {term}"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--before", required=True, type=Path)
    parser.add_argument("--after", required=True, type=Path)
    parser.add_argument("--safe", required=True, type=Path)
    parser.add_argument("--notes", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    before = args.before.read_text(encoding="utf-8")
    after = args.after.read_text(encoding="utf-8")
    safe = args.safe.read_text(encoding="utf-8")
    notes = args.notes.read_text(encoding="utf-8")

    before_deployment = document_with_kind(before, "Deployment")
    after_deployment = document_with_kind(after, "Deployment")
    safe_deployment = document_with_kind(safe, "Deployment")
    after_service = document_with_kind(after, "Service")
    safe_service = document_with_kind(safe, "Service")

    before_image = first_image(before_deployment)
    after_image = first_image(after_deployment)
    safe_image = first_image(safe_deployment)

    errors: list[str] = []
    errors.extend(has_term("rendered-before.yaml", before_deployment, "app.kubernetes.io/name: checkout"))
    errors.extend(has_term("rendered-after.yaml", after_deployment, "app: checkout"))
    errors.extend(has_term("rendered-after.yaml", after_deployment, "privileged: true"))
    errors.extend(has_term("rendered-after.yaml", after_service, "type: LoadBalancer"))
    errors.extend(has_term("safe-rendered-after.yaml", safe_deployment, "app.kubernetes.io/name: checkout"))
    errors.extend(has_term("safe-rendered-after.yaml", safe_service, "type: ClusterIP"))
    errors.extend(has_term("review-notes.md", notes, "Block the release"))

    if before_image != "registry.example.com/checkout@sha256:1111":
        errors.append(f"expected before image to be digest-pinned, got {before_image}")
    if after_image != "registry.example.com/checkout:latest":
        errors.append(f"expected after image to use latest tag, got {after_image}")
    if safe_image != "registry.example.com/checkout@sha256:2222":
        errors.append(f"expected safe image to be digest-pinned promoted image, got {safe_image}")
    if "allowPrivilegeEscalation: false" not in safe_deployment or "runAsNonRoot: true" not in safe_deployment:
        errors.append("safe render should keep non-root and no privilege escalation")
    if "privileged: true" in safe:
        errors.append("safe render should not include privileged runtime")
    if "checkout:latest" in safe:
        errors.append("safe render should not use latest tag")
    if "app: checkout" not in after_deployment or "app.kubernetes.io/name: checkout" in after_deployment.split("selector:", 1)[1]:
        errors.append("unsafe render should change the Deployment selector to app=checkout")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Helm release artifact analysis passed.")
        print("- Selector risk: Deployment selector changes from app.kubernetes.io/name=checkout to app=checkout.")
        print("- Image risk: digest-pinned image is replaced with mutable checkout:latest.")
        print("- Runtime risk: rendered container becomes privileged.")
        print("- Exposure risk: rendered Service becomes LoadBalancer.")
        print("- Safer target: stable selector, digest-pinned image, non-root security context, and ClusterIP Service.")
        print("- Decision: block the release before applying the unsafe rendered artifact.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
