#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the Kubernetes tenant boundary packet."""

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


def document_with_kind_and_name(text: str, kind: str, name: str) -> str:
    for document in re.split(r"^---\s*$", text, flags=re.MULTILINE):
        if f"kind: {kind}" in document and re.search(rf"^\s*name:\s*{re.escape(name)}\s*$", document, re.MULTILINE):
            return document
    fail(f"could not find {kind}/{name}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--broken", required=True, type=Path)
    parser.add_argument("--fixed", required=True, type=Path)
    parser.add_argument("--review", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    broken = args.broken.read_text(encoding="utf-8")
    fixed = args.fixed.read_text(encoding="utf-8")
    review = args.review.read_text(encoding="utf-8")

    risky_namespace = document_with_kind_and_name(broken, "Namespace", "tenant-a")
    risky_role = document_with_kind_and_name(broken, "Role", "app-reader")
    risky_binding = document_with_kind_and_name(broken, "ClusterRoleBinding", "tenant-a-temporary-admin")
    risky_policy = document_with_kind_and_name(broken, "NetworkPolicy", "allow-all-egress")
    fixed_namespace = document_with_kind_and_name(fixed, "Namespace", "tenant-a")
    fixed_role = document_with_kind_and_name(fixed, "Role", "app-reader")
    fixed_policy = document_with_kind_and_name(fixed, "NetworkPolicy", "default-deny-egress")

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "tenant-a.yaml",
            broken,
            [
                "pod-security.kubernetes.io/enforce: baseline",
                'resources: ["secrets"]',
                "name: allow-all-egress",
                "name: tenant-a-temporary-admin",
                "name: cluster-admin",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "review.md",
            review,
            ["Block onboarding", "secret access is narrowed", "egress is scoped", "owners and expiry dates"],
        )
    )
    if "kind: ServiceAccount" not in risky_binding or "name: deployer" not in risky_binding or "namespace: tenant-a" not in risky_binding:
        errors.append("ClusterRoleBinding should bind tenant-a/deployer")
    if "kind: ClusterRole" not in risky_binding or "name: cluster-admin" not in risky_binding:
        errors.append("ClusterRoleBinding should reference cluster-admin")
    if 'verbs: ["get", "list", "watch"]' not in risky_role:
        errors.append("risky Role should grant get/list/watch verbs")
    if "egress:\n    - {}" not in risky_policy:
        errors.append("allow-all-egress should include an empty egress rule")
    if "pod-security.kubernetes.io/enforce: baseline" not in risky_namespace:
        errors.append("risky namespace should enforce baseline Pod Security")

    if "cluster-admin" in fixed:
        errors.append("fixed manifest should remove cluster-admin")
    if 'resources: ["secrets"]' in fixed_role or 'resources: ["secrets"]' in fixed:
        errors.append("fixed manifest should remove broad secret access")
    if "pod-security.kubernetes.io/enforce: restricted" not in fixed_namespace:
        errors.append("fixed namespace should enforce restricted Pod Security")
    if "egress:" in fixed_policy:
        errors.append("default-deny-egress should not include allow-all egress rules")
    if "kind: ClusterRoleBinding" in fixed:
        errors.append("fixed manifest should not include a ClusterRoleBinding")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Tenant boundary analysis passed.")
        print("- RBAC risk: tenant-a/deployer is bound to cluster-admin through tenant-a-temporary-admin.")
        print("- Secret risk: the app-reader Role can get, list, and watch secrets.")
        print("- Pod Security risk: tenant-a starts at baseline instead of restricted.")
        print("- NetworkPolicy risk: allow-all-egress uses an empty egress rule, so it is not a boundary.")
        print("- Safer target: remove cluster-admin, remove secret access, enforce restricted, and default-deny egress.")
        print("- Decision: block onboarding until exceptions have owners, expiry dates, and scoped compensating controls.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
