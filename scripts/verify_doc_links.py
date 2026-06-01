#!/usr/bin/env python3
"""Verify repo-local Markdown links resolve to existing files."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

REPO_ROOT = Path(__file__).resolve().parents[1]
MARKDOWN_LINK_PATTERN = re.compile(r"(!?)\[[^\]]*]\(([^)]+)\)")
SKIPPED_DIRS = {
    ".git",
    ".pytest_cache",
    ".ruff_cache",
    ".terraform",
    ".venv",
    ".vite",
    "build",
    "dist",
    "node_modules",
    "playwright-report",
    "test-results",
}
SKIPPED_SCHEMES = ("http://", "https://", "mailto:", "tel:")


def markdown_files() -> list[Path]:
    return [
        path
        for path in sorted(REPO_ROOT.rglob("*.md"))
        if not any(part in SKIPPED_DIRS for part in path.relative_to(REPO_ROOT).parts)
    ]


def link_target(raw_target: str) -> str:
    target = raw_target.strip()
    if target.startswith("<"):
        end = target.find(">")
        target = target[1:end] if end != -1 else target[1:]
    else:
        target = target.split()[0]
    return unquote(target)


def should_skip(target: str) -> bool:
    return not target or target.startswith("#") or target.startswith(SKIPPED_SCHEMES)


def target_path(source: Path, target: str) -> Path:
    without_anchor = target.split("#", 1)[0]
    if not without_anchor:
        return source
    path = Path(without_anchor)
    if path.is_absolute():
        return REPO_ROOT / path.relative_to("/")
    return source.parent / path


def main() -> int:
    failures: list[str] = []
    checked = 0
    for markdown_file in markdown_files():
        content = markdown_file.read_text(encoding="utf-8")
        for match in MARKDOWN_LINK_PATTERN.finditer(content):
            target = link_target(match.group(2))
            if should_skip(target):
                continue
            checked += 1
            resolved = target_path(markdown_file, target)
            if not resolved.exists():
                location = markdown_file.relative_to(REPO_ROOT)
                failures.append(f"{location}: missing local link target {target}")

    if failures:
        print("\n".join(failures), file=sys.stderr)
        return 1

    print(f"Verified {checked} repo-local Markdown links across {len(markdown_files())} files.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
