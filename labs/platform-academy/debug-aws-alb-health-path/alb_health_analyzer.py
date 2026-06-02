#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the AWS ALB health-path lab."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def document_with_kind(text: str, kind: str) -> str:
    for document in re.split(r"^---\s*$", text, flags=re.MULTILINE):
        if f"kind: {kind}" in document:
            return document
    fail(f"could not find {kind} document")


def has_term(label: str, text: str, term: str) -> list[str]:
    return [] if term in text else [f"{label} missing: {term}"]


def target_descriptions(path: Path) -> list[dict[str, Any]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{path} is not parseable JSON: {exc}")
    descriptions = data.get("TargetHealthDescriptions", []) if isinstance(data, dict) else []
    if not isinstance(descriptions, list):
        fail("target-health.json should contain TargetHealthDescriptions list")
    return [item for item in descriptions if isinstance(item, dict)]


def unhealthy_response_mismatch(descriptions: list[dict[str, Any]]) -> bool:
    for description in descriptions:
        health = description.get("TargetHealth", {})
        if not isinstance(health, dict):
            continue
        if (
            health.get("State") == "unhealthy"
            and health.get("Reason") == "Target.ResponseCodeMismatch"
            and "404" in str(health.get("Description", ""))
        ):
            return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target-health", required=True, type=Path)
    parser.add_argument("--events", required=True, type=Path)
    parser.add_argument("--broken", required=True, type=Path)
    parser.add_argument("--fixed", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    descriptions = target_descriptions(args.target_health)
    events = args.events.read_text(encoding="utf-8")
    broken = args.broken.read_text(encoding="utf-8")
    fixed = args.fixed.read_text(encoding="utf-8")

    broken_ingress = document_with_kind(broken, "Ingress")
    broken_service = document_with_kind(broken, "Service")
    broken_pod = document_with_kind(broken, "Pod")
    fixed_ingress = document_with_kind(fixed, "Ingress")
    fixed_service = document_with_kind(fixed, "Service")
    fixed_pod = document_with_kind(fixed, "Pod")

    errors: list[str] = []
    if not unhealthy_response_mismatch(descriptions):
        errors.append("target-health.json should include unhealthy Target.ResponseCodeMismatch with HTTP 404")
    if not any(
        isinstance(item.get("TargetHealth"), dict) and item["TargetHealth"].get("State") == "healthy"
        for item in descriptions
    ):
        errors.append("target-health.json should include at least one healthy target for comparison")

    errors.extend(has_term("events.txt", events, "Target.ResponseCodeMismatch"))
    errors.extend(has_term("events.txt", events, "targetPort web has no matching Pod port name"))
    errors.extend(has_term("broken Ingress", broken_ingress, "alb.ingress.kubernetes.io/healthcheck-path: /healthz"))
    errors.extend(has_term("broken Ingress", broken_ingress, 'alb.ingress.kubernetes.io/success-codes: "200"'))
    errors.extend(has_term("broken Service", broken_service, "targetPort: web"))
    errors.extend(has_term("broken Pod", broken_pod, "name: http"))
    errors.extend(has_term("broken Pod", broken_pod, "containerPort: 8080"))
    errors.extend(has_term("broken Pod", broken_pod, "http.server"))
    errors.extend(has_term("fixed Ingress", fixed_ingress, "alb.ingress.kubernetes.io/healthcheck-path: /"))
    errors.extend(has_term("fixed Service", fixed_service, "targetPort: http"))
    errors.extend(has_term("fixed Pod", fixed_pod, "name: http"))

    if "targetPort: web" in fixed_service:
        errors.append("fixed Service should not keep targetPort web")
    if "alb.ingress.kubernetes.io/healthcheck-path: /healthz" in fixed_ingress:
        errors.append("fixed Ingress should not keep /healthz for this sample app")
    if "targetPort: web" not in broken_service or "name: http" not in broken_pod:
        errors.append("broken manifest should expose targetPort web mismatch with Pod port http")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("ALB health path analysis passed.")
        print("- ALB evidence: unhealthy target reports Target.ResponseCodeMismatch with HTTP 404.")
        print("- Health path risk: Ingress asks ALB to check /healthz for an app serving /.")
        print("- Service/Pod risk: Service targetPort web does not match Pod port name http.")
        print("- Controller evidence: event names the targetPort-to-Pod-port mismatch.")
        print("- Fixed target: health check path / and Service targetPort http.")
        print("- Owner decision: source manifest and app health contract need owner confirmation; avoid console-only fixes.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
