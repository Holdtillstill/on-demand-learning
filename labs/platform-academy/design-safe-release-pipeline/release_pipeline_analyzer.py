#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the safe release pipeline packet."""

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


def find_job_block(text: str, job_name: str) -> str:
    pattern = rf"(?ms)^  {re.escape(job_name)}:\n(?P<body>.*?)(?=^  [A-Za-z0-9_-]+:\n|\Z)"
    match = re.search(pattern, text)
    if not match:
        fail(f"could not find job {job_name}")
    return match.group("body")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--unsafe", required=True, type=Path)
    parser.add_argument("--safe", required=True, type=Path)
    parser.add_argument("--checklist", required=True, type=Path)
    parser.add_argument("--decision", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    unsafe = args.unsafe.read_text(encoding="utf-8")
    safe = args.safe.read_text(encoding="utf-8")
    checklist = args.checklist.read_text(encoding="utf-8")
    decision = args.decision.read_text(encoding="utf-8")

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "pipeline.yaml",
            unsafe,
            [
                "deploy-prod:",
                "github.ref == 'refs/heads/main'",
                "missing digest promotion",
                "helm upgrade --install checkout charts/checkout -f values/prod.yaml",
            ],
        )
    )
    for forbidden in ["deploy-staging:", "trivy image", "syft", "smoke.sh", "environment: production"]:
        if forbidden in unsafe:
            errors.append(f"pipeline.yaml should not already include {forbidden}")

    errors.extend(
        missing_terms(
            "safe-pipeline.yaml",
            safe,
            [
                "permissions:",
                "id-token: write",
                "security-events: write",
                "image-digest.txt",
                "trivy image",
                "syft",
                "helm template",
                "kubeconform",
                "conftest test",
                "deploy-staging:",
                "environment: staging",
                "environment: production",
                "rollout.strategy=canary",
                "smoke.sh",
                "rollback-if-slo-breach",
            ],
        )
    )
    if "helm upgrade --install checkout charts/checkout -f values/prod.yaml" in safe:
        errors.append("safe-pipeline.yaml should not keep the unsafe direct prod Helm command")

    build_block = find_job_block(safe, "build")
    verify_block = find_job_block(safe, "verify")
    staging_block = find_job_block(safe, "deploy-staging")
    prod_block = find_job_block(safe, "deploy-prod")
    if "outputs:" not in build_block or "image_digest" not in build_block:
        errors.append("build job should expose the promoted image digest")
    if "needs: build" not in verify_block:
        errors.append("verify job should depend on build")
    if "needs: verify" not in staging_block:
        errors.append("deploy-staging should depend on verify")
    if "needs: deploy-staging" not in prod_block:
        errors.append("deploy-prod should depend on deploy-staging")
    if "--set image.digest=$(cat image-digest.txt)" not in staging_block:
        errors.append("deploy-staging should deploy by image digest")
    if "--set image.digest=$(cat image-digest.txt)" not in prod_block:
        errors.append("deploy-prod should deploy by image digest")

    errors.extend(
        missing_terms(
            "release-checklist.md",
            checklist,
            ["Build once and promote by immutable digest", "Restrict production deployment permissions", "Run smoke tests"],
        )
    )
    errors.extend(
        missing_terms(
            "decision-record.md",
            decision,
            ["Block the current pipeline", "promote the exact image digest", "rollback", "approval"],
        )
    )

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Safe release pipeline analysis passed.")
        print("- Unsafe path: deploy-prod runs from main with a direct production Helm command.")
        print("- Promotion gap: the unsafe pipeline uses a tag and records missing digest promotion.")
        print("- Required gates: image scan, SBOM, manifest render, schema validation, and policy checks.")
        print("- Artifact chain: build writes image-digest.txt and downstream jobs deploy that digest.")
        print("- Rollout chain: verify -> staging -> production approval -> canary -> smoke -> SLO rollback.")
        print("- Decision: block the current pipeline until the safe release contract is used.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
