#!/usr/bin/env python3
"""Verify changed tracked and untracked files are clean enough to review."""

from __future__ import annotations

import re
import stat
import subprocess
import sys
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


def git_lines(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), *args],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def changed_paths() -> list[Path]:
    paths: set[str] = set()
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
    errors: list[str] = []
    paths = changed_paths()
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
        f"Verified working-tree hygiene for {existing_count} changed files "
        f"({text_count} text files inspected)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
