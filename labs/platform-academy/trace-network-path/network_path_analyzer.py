#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the HTTP network path lab."""

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


def has_term(label: str, text: str, term: str) -> list[str]:
    return [] if term in text else [f"{label} missing: {term}"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--handoff", required=True, type=Path)
    parser.add_argument("--evidence", required=True, type=Path)
    parser.add_argument("--broken", required=True, type=Path)
    parser.add_argument("--fixed", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    handoff = args.handoff.read_text(encoding="utf-8")
    evidence = args.evidence.read_text(encoding="utf-8")
    broken = args.broken.read_text(encoding="utf-8")
    fixed = args.fixed.read_text(encoding="utf-8")

    broken_ingress = document_with_kind(broken, "Ingress")
    broken_service = document_with_kind(broken, "Service")
    broken_pod = document_with_kind(broken, "Pod")
    fixed_ingress = document_with_kind(fixed, "Ingress")
    fixed_service = document_with_kind(fixed, "Service")
    fixed_pod = document_with_kind(fixed, "Pod")

    errors: list[str] = []
    errors.extend(has_term("incident-handoff.md", handoff, "HTTP/2 503"))
    errors.extend(has_term("incident-handoff.md", handoff, "Do not change DNS, ALB listener rules, or live Kubernetes objects"))
    errors.extend(has_term("incident-handoff.md", handoff, "Target.ResponseCodeMismatch"))
    errors.extend(has_term("incident-handoff.md", handoff, "targetPort web"))
    errors.extend(has_term("network-evidence.md", evidence, "server: awselb/2.0"))
    errors.extend(has_term("network-evidence.md", evidence, "Target.ResponseCodeMismatch"))
    errors.extend(has_term("network-evidence.md", evidence, "backend service checkout port http"))
    errors.extend(has_term("network-evidence.md", evidence, "port http: 80 -> targetPort web"))
    errors.extend(has_term("network-evidence.md", evidence, "ports=http:8080"))
    errors.extend(has_term("broken Ingress", broken_ingress, "host: checkout.example.com"))
    errors.extend(has_term("broken Ingress", broken_ingress, "path: /healthz"))
    errors.extend(has_term("broken Service", broken_service, "targetPort: web"))
    errors.extend(has_term("broken Pod", broken_pod, "name: http"))
    errors.extend(has_term("broken Pod", broken_pod, "containerPort: 8080"))
    errors.extend(has_term("fixed Service", fixed_service, "targetPort: http"))
    errors.extend(has_term("fixed Ingress", fixed_ingress, "host: checkout.example.com"))
    errors.extend(has_term("fixed Ingress", fixed_ingress, "path: /healthz"))
    errors.extend(has_term("fixed Pod", fixed_pod, "name: http"))

    if "targetPort: web" in fixed_service:
        errors.append("fixed Service should not keep targetPort web")
    if "host: checkout.example.com" not in fixed_ingress or "path: /healthz" not in fixed_ingress:
        errors.append("fixed manifest should preserve the Ingress host/path")
    if "targetPort: web" not in broken_service or "name: http" not in broken_pod:
        errors.append("broken manifest should show targetPort web mismatching Pod port name http")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Network path analysis passed.")
        print("- Edge symptom: checkout.example.com/healthz returns HTTP/2 503 from awselb.")
        print("- ALB evidence: target health reports Target.ResponseCodeMismatch.")
        print("- Ingress evidence: host/path route to Service checkout port http.")
        print("- Service/Pod risk: Service targetPort web does not match Pod port name http.")
        print("- Fixed target: preserve Ingress host/path and change Service targetPort to http.")
        print("- Owner decision: app/platform owns the source manifest, not DNS or ALB console owners.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
