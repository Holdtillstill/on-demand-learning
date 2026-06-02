#!/usr/bin/env python3
"""Scan public repository text for stale process notes and sensitive identifiers."""

from __future__ import annotations

import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]

SKIP_DIRS = {
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".terraform",
    ".venv",
    ".vite",
    "__pycache__",
    "coverage",
    "dist",
    "htmlcov",
    "node_modules",
    "playwright-report",
    "smoke-artifacts",
    "test-results",
}

TEXT_SUFFIXES = {
    ".css",
    ".html",
    ".js",
    ".json",
    ".md",
    ".mjs",
    ".py",
    ".sh",
    ".toml",
    ".ts",
    ".tsx",
    ".txt",
    ".yaml",
    ".yml",
}

REMOVED_DOCS = {
    Path("docs/platform-academy-browser-local-progress-plan.md"),
    Path("docs/platform-academy-premium-polish-plan.md"),
}

PUBLIC_TEXT_PATTERNS = [
    ("assistant/tooling name", re.compile(r"\b(Codex|Gemini|Claude|ChatGPT|LLM)\b", re.IGNORECASE)),
    ("internal workspace artifact", re.compile(r"\b(antigravity|portfolio_review|ybz\.dev)\b", re.IGNORECASE)),
    ("stale branch reference", re.compile(r"\bcodex/runnable-labs\b", re.IGNORECASE)),
    ("controller prompt language", re.compile(r"\bdo not commit; controller\b", re.IGNORECASE)),
    ("runtime status mislabel", re.compile(r"\bLive static demo\b", re.IGNORECASE)),
    ("GitHub Actions badge URL", re.compile(r"actions/workflows/[^\s)]+/badge\.svg|badge\.svg", re.IGNORECASE)),
]

SENSITIVE_PATTERNS = [
    ("Discord webhook", re.compile(r"discord\.com/api/webhooks/", re.IGNORECASE)),
    ("account-specific AWS ARN", re.compile(r"arn:aws:[^\s\"'`]+::([0-9]{12})[^\s\"'`]*", re.IGNORECASE)),
    ("ECR registry account", re.compile(r"([0-9]{12})\.dkr\.ecr\.[^\s\"'`]+", re.IGNORECASE)),
    ("state bucket account suffix", re.compile(r"terraform-state-([0-9]{12})", re.IGNORECASE)),
    ("hosted zone id assignment", re.compile(r"hosted_zone_id[^\n]*Z[A-Z0-9]{10,32}", re.IGNORECASE)),
]

ALLOWED_PLACEHOLDER_ACCOUNTS = {"000000000000", "111122223333", "123456789012"}


def is_skipped(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def is_text_path(path: Path) -> bool:
    return path.suffix in TEXT_SUFFIXES or path.name in {".env.example", "Makefile"}


def read_text(path: Path) -> str | None:
    data = path.read_bytes()
    if b"\0" in data:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def scan_file(path: Path, errors: list[str]) -> None:
    text = read_text(path)
    if text is None:
        return
    rel = path.relative_to(REPO_ROOT)
    for line_number, line in enumerate(text.splitlines(), start=1):
        for label, pattern in PUBLIC_TEXT_PATTERNS:
            if pattern.search(line):
                errors.append(f"{rel}:{line_number}: {label}")
        for label, pattern in SENSITIVE_PATTERNS:
            for match in pattern.finditer(line):
                account = match.group(1) if match.lastindex else ""
                if account and account in ALLOWED_PLACEHOLDER_ACCOUNTS:
                    continue
                errors.append(f"{rel}:{line_number}: {label}")


def verify_public_shell(errors: list[str]) -> None:
    shell_path = REPO_ROOT / "apps" / "platform-academy" / "index.html"
    shell = read_text(shell_path)
    if shell is None:
        errors.append("apps/platform-academy/index.html: public shell is unreadable")
        return
    if 'src="https://on-demand-demos.bozhi.dev/visitor.js"' not in shell:
        errors.append("apps/platform-academy/index.html: missing first-party visitor script")
    if 'data-project="platform-academy"' not in shell:
        errors.append("apps/platform-academy/index.html: missing platform-academy visitor project id")
    required_markers = {
        "canonical metadata": '<link rel="canonical" href="https://platform-academy.bozhi.dev/"',
        "OpenGraph URL metadata": 'property="og:url" content="https://platform-academy.bozhi.dev/"',
        "OpenGraph preview image": 'property="og:image" content="https://platform-academy.bozhi.dev/social-preview.jpg"',
        "Twitter large preview card": 'name="twitter:card" content="summary_large_image"',
        "Twitter preview image": 'name="twitter:image" content="https://platform-academy.bozhi.dev/social-preview.jpg"',
        "robots metadata": 'name="robots" content="index,follow"',
    }
    for label, marker in required_markers.items():
        if marker not in shell:
            errors.append(f"apps/platform-academy/index.html: missing {label}")


def verify_public_discovery(errors: list[str]) -> None:
    public_dir = REPO_ROOT / "apps" / "platform-academy" / "public"
    robots = read_text(public_dir / "robots.txt")
    if robots is None:
        errors.append("apps/platform-academy/public/robots.txt: missing")
    elif "Sitemap: https://platform-academy.bozhi.dev/sitemap.xml" not in robots:
        errors.append("apps/platform-academy/public/robots.txt: missing sitemap reference")

    sitemap = read_text(public_dir / "sitemap.xml")
    if sitemap is None:
        errors.append("apps/platform-academy/public/sitemap.xml: missing")
    else:
        for route in ["/", "/dashboard/home", "/roadmap", "/labs", "/resources", "/interview-prep"]:
            expected = f"https://platform-academy.bozhi.dev{route if route != '/' else '/'}"
            if expected not in sitemap:
                errors.append(f"apps/platform-academy/public/sitemap.xml: missing {route}")

    if not (public_dir / "social-preview.jpg").exists():
        errors.append("apps/platform-academy/public/social-preview.jpg: missing social preview image")


def verify_issue_templates(errors: list[str]) -> None:
    config = read_text(REPO_ROOT / ".github" / "ISSUE_TEMPLATE" / "config.yml")
    if config is None:
        errors.append(".github/ISSUE_TEMPLATE/config.yml: missing")
    else:
        if "blank_issues_enabled: false" not in config:
            errors.append(".github/ISSUE_TEMPLATE/config.yml: blank public issues should stay disabled")
        if "SECURITY.md" not in config:
            errors.append(".github/ISSUE_TEMPLATE/config.yml: missing security policy contact link")

    bug_template = read_text(REPO_ROOT / ".github" / "ISSUE_TEMPLATE" / "bug_report.yml")
    if bug_template is None:
        errors.append(".github/ISSUE_TEMPLATE/bug_report.yml: missing")
    elif "Paste sanitized logs" not in bug_template:
        errors.append(".github/ISSUE_TEMPLATE/bug_report.yml: evidence instructions must require sanitized logs")


def verify_contributing(errors: list[str]) -> None:
    contributing = read_text(REPO_ROOT / "CONTRIBUTING.md")
    if contributing is None:
        errors.append("CONTRIBUTING.md: missing")
        return
    if "Do not include secrets" not in contributing:
        errors.append("CONTRIBUTING.md: missing public-safety contribution boundary")
    if "python3 scripts/verify_public_readiness.py" not in contributing:
        errors.append("CONTRIBUTING.md: missing public-readiness validation command")


def verify_dependabot(errors: list[str]) -> None:
    dependabot = read_text(REPO_ROOT / ".github" / "dependabot.yml")
    if dependabot is None:
        errors.append(".github/dependabot.yml: missing")
        return
    for group in [
        "actions-dependencies",
        "academy-npm-dependencies",
        "api-python-dependencies",
        "worker-python-dependencies",
        "api-docker-dependencies",
        "academy-docker-dependencies",
        "worker-docker-dependencies",
        "terraform-dependencies",
    ]:
        if group not in dependabot:
            errors.append(f".github/dependabot.yml: missing grouped update rule {group}")


def main() -> int:
    errors: list[str] = []
    for stale_doc in sorted(REMOVED_DOCS):
        if (REPO_ROOT / stale_doc).exists():
            errors.append(f"{stale_doc}: stale implementation-plan doc should not be public")

    for path in sorted(REPO_ROOT.rglob("*")):
        rel = path.relative_to(REPO_ROOT)
        if not path.is_file() or is_skipped(rel) or not is_text_path(path):
            continue
        if rel == Path("scripts/verify_public_readiness.py"):
            continue
        scan_file(path, errors)

    verify_public_shell(errors)
    verify_public_discovery(errors)
    verify_issue_templates(errors)
    verify_contributing(errors)
    verify_dependabot(errors)

    if errors:
        print("FAIL: public-readiness check failed:", file=sys.stderr)
        for error in errors[:120]:
            print(f"- {error}", file=sys.stderr)
        if len(errors) > 120:
            print(f"- ... {len(errors) - 120} more issue(s)", file=sys.stderr)
        return 1

    print("public readiness checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
