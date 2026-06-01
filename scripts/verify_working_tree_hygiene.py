#!/usr/bin/env python3
"""Verify branch and working-tree files are clean enough to review."""

from __future__ import annotations

import argparse
import os
import re
import stat
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
GENERATED_DIR_NAMES = {
    ".pytest_cache",
    ".vite",
    "__pycache__",
    "coverage",
    "dist",
    "node_modules",
    "playwright-report",
    "smoke-artifacts",
    "test-results",
}
GENERATED_FILE_NAMES = {
    "ci-platform-browser-smoke.db",
    "ci-smoke.db",
    "ci-test.db",
    "test.db",
}
CONFLICT_MARKER_RE = re.compile(r"^(?:<{7}|>{7})(?: .*)?$|^={7}$")
MAX_REPORTED_ERRORS = 80


@dataclass(frozen=True)
class ReviewBase:
    ref: str
    merge_base: str


def git_lines(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def git_text_optional(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def git_lines_optional(*args: str) -> list[str]:
    return [line for line in git_text_optional(*args).splitlines() if line]


def resolve_review_base(base_ref: str | None, dirty_only: bool) -> ReviewBase | None:
    if dirty_only:
        return None
    configured = base_ref or os.environ.get("PLATFORM_REVIEW_BASE", "").strip()
    if configured:
        merge_base = git_lines_optional("merge-base", "HEAD", configured)
        if not merge_base:
            raise SystemExit(f"Unable to resolve review base: {configured}")
        return ReviewBase(ref=configured, merge_base=merge_base[0])
    github_base_ref = os.environ.get("GITHUB_BASE_REF", "").strip()
    candidates = []
    if github_base_ref:
        candidates.extend([f"origin/{github_base_ref}", github_base_ref])
    candidates.extend(["origin/main", "main"])
    for candidate in candidates:
        merge_base = git_lines_optional("merge-base", "HEAD", candidate)
        if merge_base:
            return ReviewBase(ref=candidate, merge_base=merge_base[0])
    return None


def describe_review_base(base: ReviewBase | None) -> str:
    if base is None:
        return "not found; dirty changes only"
    return f"{base.ref} (merge-base {base.merge_base[:12]})"


def changed_paths(base: ReviewBase | None) -> list[Path]:
    paths: set[str] = set()
    if base:
        paths.update(git_lines("diff", "--name-only", "--diff-filter=ACMRTUXB", f"{base.merge_base}..HEAD", "--"))
    for args in (
        ("diff", "--name-only", "--diff-filter=ACMRTUXB", "--"),
        ("diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB", "--"),
        ("ls-files", "--others", "--exclude-standard"),
    ):
        paths.update(git_lines(*args))
    return [Path(path) for path in sorted(paths)]


def is_generated_path(path: Path) -> bool:
    return (
        any(part in GENERATED_DIR_NAMES for part in path.parts)
        or path.name in GENERATED_FILE_NAMES
        or path.name.endswith(".pyc")
        or path.name.endswith(".tsbuildinfo")
    )


def should_be_executable(path: Path) -> bool:
    path_text = path.as_posix()
    if path.suffix != ".sh":
        return False
    if path_text.startswith("scripts/"):
        return True
    return path_text.startswith("labs/platform-academy/") and "/lib/" not in path_text


def text_from_bytes(data: bytes) -> str | None:
    if b"\0" in data:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        return None


def verify_text(path: Path, text: str, errors: list[str]) -> None:
    for line_number, line in enumerate(text.splitlines(keepends=True), start=1):
        if line.endswith("\r\n"):
            errors.append(f"{path}:{line_number}: CRLF line ending")
            line_body = line[:-2]
        elif line.endswith("\n"):
            line_body = line[:-1]
        else:
            line_body = line
        if line_body.rstrip(" \t") != line_body:
            errors.append(f"{path}:{line_number}: trailing whitespace")
        if CONFLICT_MARKER_RE.match(line_body):
            errors.append(f"{path}:{line_number}: conflict marker")
    if text and not text.endswith("\n"):
        errors.append(f"{path}: missing final newline")


def verify_path(path: Path, errors: list[str]) -> tuple[bool, bool]:
    full_path = REPO_ROOT / path
    if not full_path.exists() or not full_path.is_file():
        return (False, False)
    if is_generated_path(path):
        errors.append(f"{path}: generated artifact should not be staged or reviewed")
    if should_be_executable(path) and not full_path.stat().st_mode & stat.S_IXUSR:
        errors.append(f"{path}: shell entrypoint is not executable")

    data = full_path.read_bytes()
    text = text_from_bytes(data)
    if text is None:
        return (True, False)
    verify_text(path, text, errors)
    return (True, True)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base",
        metavar="REF",
        help="compare committed branch changes against REF; defaults to PLATFORM_REVIEW_BASE, origin/main, then main",
    )
    parser.add_argument(
        "--dirty-only",
        action="store_true",
        help="ignore committed branch changes and inspect only modified, staged, and untracked files",
    )
    args = parser.parse_args()

    base = resolve_review_base(args.base, args.dirty_only)
    errors: list[str] = []
    paths = changed_paths(base)
    existing_count = 0
    text_count = 0
    for path in paths:
        exists, is_text = verify_path(path, errors)
        existing_count += int(exists)
        text_count += int(is_text)

    if errors:
        print("FAIL: changed-file hygiene check failed:", file=sys.stderr)
        for error in errors[:MAX_REPORTED_ERRORS]:
            print(f"- {error}", file=sys.stderr)
        remaining = len(errors) - MAX_REPORTED_ERRORS
        if remaining > 0:
            print(f"- ... {remaining} more issue(s)", file=sys.stderr)
        return 1

    print(
        f"Verified working-tree hygiene for {existing_count} review files "
        f"({text_count} text files inspected) against {describe_review_base(base)}."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
