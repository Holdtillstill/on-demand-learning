#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the Docker image supply-chain packet."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

SECRET_VALUE = "API_TOKEN=do-not-bake-secrets"


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"could not parse {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"{path} should contain a JSON object")
    return value


def require_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    if missing:
        return [f"{label} missing: {', '.join(missing)}"]
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dockerfile", required=True, type=Path)
    parser.add_argument("--inspect", required=True, type=Path)
    parser.add_argument("--history", required=True, type=Path)
    parser.add_argument("--hardened", required=True, type=Path)
    parser.add_argument("--promotion", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    dockerfile = args.dockerfile.read_text(encoding="utf-8")
    inspect = read_json(args.inspect)
    history = args.history.read_text(encoding="utf-8")
    hardened = args.hardened.read_text(encoding="utf-8")
    promotion = args.promotion.read_text(encoding="utf-8")

    repo_tags = inspect.get("RepoTags", [])
    repo_digests = inspect.get("RepoDigests", [])
    config = inspect.get("Config", {})
    image_env = config.get("Env", []) if isinstance(config, dict) else []
    runtime_user = config.get("User", None) if isinstance(config, dict) else None

    errors: list[str] = []
    errors.extend(require_terms("Dockerfile", dockerfile, ["FROM node:22 AS build", SECRET_VALUE, "COPY --from=build /app ."]))
    errors.extend(require_terms("history.txt", history, [SECRET_VALUE, "COPY /app . # build output plus source tree"]))
    errors.extend(
        require_terms(
            "hardened.Dockerfile",
            hardened,
            ["FROM node:22-bookworm-slim AS runtime", "npm ci --omit=dev", "USER node", "CMD [\"node\", \"dist/server.js\"]"],
        )
    )
    errors.extend(require_terms("promotion-note.md", promotion, ["Immutable image digest", "SBOM artifact", "Rollback digest"]))

    if "USER " in dockerfile:
        errors.append("starting Dockerfile should not already set a runtime user")
    if "API_TOKEN" in hardened:
        errors.append("hardened.Dockerfile should not contain secret material")
    if repo_tags != ["checkout:latest"]:
        errors.append(f"expected RepoTags to be ['checkout:latest'], got {repo_tags!r}")
    if repo_digests != []:
        errors.append(f"expected RepoDigests to be empty, got {repo_digests!r}")
    if runtime_user != "":
        errors.append(f"expected blank runtime user in image inspect, got {runtime_user!r}")
    if SECRET_VALUE not in image_env:
        errors.append("image inspect Config.Env should include the baked secret")

    required_promotion_terms = ["digest", "SBOM", "scan", "non-root", "rollback"]
    missing_promotion_terms = [term for term in required_promotion_terms if term.lower() not in promotion.lower()]
    if missing_promotion_terms:
        errors.append(f"promotion-note.md missing required release evidence: {', '.join(missing_promotion_terms)}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Docker supply-chain analysis passed.")
        print("- Promotion risk: checkout:latest is mutable and RepoDigests is empty.")
        print("- Secret leakage: API_TOKEN appears in Dockerfile, image config, and layer history.")
        print("- Runtime risk: image inspect user is blank/root and runtime copies the full /app tree.")
        print("- Hardened target: production dependencies only, dist-only copy, and USER node.")
        print("- Required evidence: immutable digest, SBOM artifact, vulnerability scan, and rollback digest.")
        print("- Decision: block promotion of checkout:latest until the hardened packet is complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
