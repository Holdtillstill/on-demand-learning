#!/usr/bin/env python3
"""Evidence-oriented local analyzer for CrashLoopBackOff versus ImagePullBackOff."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def document_named(text: str, name: str) -> str:
    for document in re.split(r"^---\s*$", text, flags=re.MULTILINE):
        if f"name: {name}" in document:
            return document
    fail(f"could not find manifest document for {name}")


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

    start_crash = document_named(start, "checkout-crash")
    start_pull = document_named(start, "checkout-pull")
    fixed_crash = document_named(fixed, "checkout-crash")
    fixed_pull = document_named(fixed, "checkout-pull")

    errors: list[str] = []
    errors.extend(has_term("start.yaml checkout-crash", start_crash, "missing DB_URL"))
    errors.extend(has_term("start.yaml checkout-crash", start_crash, "exit 42"))
    errors.extend(has_term("start.yaml checkout-pull", start_pull, "registry.invalid.example/checkout:missing"))
    errors.extend(has_term("fixed.yaml checkout-crash", fixed_crash, "checkout healthy"))
    errors.extend(has_term("fixed.yaml checkout-pull", fixed_pull, "image: nginx:1.25-alpine"))
    errors.extend(has_term("broken-evidence.txt", transcript, "checkout-crash"))
    errors.extend(has_term("broken-evidence.txt", transcript, "CrashLoopBackOff"))
    errors.extend(has_term("broken-evidence.txt", transcript, "Exit Code:    42"))
    errors.extend(has_term("broken-evidence.txt", transcript, "missing DB_URL"))
    errors.extend(has_term("broken-evidence.txt", transcript, "checkout-pull"))
    errors.extend(has_term("broken-evidence.txt", transcript, "ImagePullBackOff"))
    errors.extend(has_term("broken-evidence.txt", transcript, "registry.invalid.example/checkout:missing"))
    errors.extend(has_term("broken-evidence.txt", transcript, "ErrImagePull"))
    errors.extend(has_term("broken-evidence.txt", transcript, "waiting to start"))

    if "registry.invalid.example/checkout:missing" in fixed:
        errors.append("fixed.yaml should remove the invalid registry reference")
    if "exit 42" in fixed:
        errors.append("fixed.yaml should remove the intentional crash command")
    if "--previous" not in transcript:
        errors.append("transcript should show previous-log evidence for the crash case")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("CrashLoop/ImagePull analysis passed.")
        print("- CrashLoop evidence: checkout-crash started, exited 42, and previous logs show missing DB_URL.")
        print("- ImagePull evidence: checkout-pull never started because registry.invalid.example cannot resolve.")
        print("- Ownership split: app/config owns checkout-crash; image/registry owns checkout-pull.")
        print("- Fixed target: keep checkout-crash alive and replace the invalid image with nginx:1.25-alpine.")
        print("- Decision: validate both rollouts and clean up payments-debug.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
