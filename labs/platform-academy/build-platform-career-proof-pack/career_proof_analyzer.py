#!/usr/bin/env python3
"""Validation-oriented local analyzer for the platform career artifact pack."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def missing_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    return [f"{label} missing: {', '.join(missing)}"] if missing else []


def markdown_bullets(text: str) -> list[str]:
    return [line.strip() for line in text.splitlines() if line.startswith("- ")]


def section_body(text: str, section: str) -> str:
    match = re.search(rf"(?ms)^## {re.escape(section)}\n(?P<body>.*?)(?=^## |\Z)", text)
    return match.group("body") if match else ""


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--skills", required=True, type=Path)
    parser.add_argument("--inventory", required=True, type=Path)
    parser.add_argument("--proof", required=True, type=Path)
    parser.add_argument("--bullets", required=True, type=Path)
    parser.add_argument("--star", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    skills = args.skills.read_text(encoding="utf-8")
    inventory = args.inventory.read_text(encoding="utf-8")
    proof = args.proof.read_text(encoding="utf-8")
    bullets = args.bullets.read_text(encoding="utf-8")
    star = args.star.read_text(encoding="utf-8")

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "job-skills.txt",
            skills,
            [
                "Kubernetes",
                "Terraform",
                "AWS",
                "CI/CD",
                "incident response",
                "observability",
                "EKS",
                "Helm",
                "ArgoCD",
                "Docker",
                "supply chain",
                "release engineering",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "evidence-inventory.md",
            inventory,
            [
                "Candidate artifacts",
                "Trace Service traffic to ready Pods",
                "Terraform EKS plan review",
                "SLO-backed runbook",
                "Tenant boundary audit",
                "Cost driver audit",
                "Missing evidence to collect",
                "Screenshots of lab output",
                "One architecture diagram",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "completed-proof-readme.md",
            proof,
            [
                "Kubernetes Service Debugging and Release Safety",
                "## Problem",
                "## Environment",
                "## Commands And Validation",
                "kubectl describe svc checkout -n payments",
                "bash labs/platform-academy/verify-full-labs.sh",
                "digest promotion",
                "## Validation",
                "## Rollback",
                "## Technical Talking Points",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "resume-bullets.md",
            bullets,
            ["repository-backed", "profile-backed", "digest, SBOM, scan", "rollback", "portfolio-ready"],
        )
    )

    if len(markdown_bullets(inventory)) < 10:
        errors.append("evidence-inventory.md should include candidate artifacts and missing-evidence bullets")
    if len(markdown_bullets(bullets)) < 5:
        errors.append("resume-bullets.md should include at least five evidence-backed bullets")
    for story in ["Incident Response", "Security", "Cost", "Release Safety"]:
        body = section_body(star, story)
        if not body:
            errors.append(f"star-stories.md missing story section: {story}")
            continue
        for label in ["Situation:", "Task:", "Action:", "Result:"]:
            if label not in body:
                errors.append(f"star-stories.md {story} missing {label}")
    for risky_claim in ["secret=", "password=", "customer@example.com", "prod-111122223333"]:
        if risky_claim in proof or risky_claim in bullets or risky_claim in star:
            errors.append(f"public artifact pack should not include private-looking value: {risky_claim}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Career artifact pack analysis passed.")
        print("- Skill demand: Kubernetes, Terraform, AWS, CI/CD, incident, observability, EKS, Helm, ArgoCD, Docker.")
        print("- Evidence inventory: candidate artifacts and missing evidence are both explicit.")
        print("- Artifact README: problem, environment, commands, decision, validation, rollback, and talking points are filled.")
        print("- Resume bullets: platform scope, product implementation, supply chain, and portfolio artifacts are represented.")
        print("- STAR stories: incident response, security, cost, and release safety each include Situation/Task/Action/Result.")
        print("- Safety: public artifacts avoid obvious secrets, customer identifiers, and live production account values.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
