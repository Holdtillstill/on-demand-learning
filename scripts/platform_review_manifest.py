#!/usr/bin/env python3
"""Generate a reviewer-oriented manifest for changed tracked and untracked files."""

from __future__ import annotations

import argparse
import subprocess
from collections import defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


@dataclass(frozen=True)
class ReviewArea:
    name: str
    owner: str
    focus: str


AREAS = {
    "api": ReviewArea(
        "API, Worker, And Persistence",
        "API/backend reviewer",
        "Schemas, migrations, persistence behavior, product API contracts, tests.",
    ),
    "ui": ReviewArea(
        "Platform Academy Frontend",
        "Frontend reviewer",
        "Routes, workbook UX, browser smoke coverage, bundle/download flows.",
    ),
    "labs": ReviewArea(
        "Lab Source Artifacts",
        "Lab/content reviewer",
        "Learner artifacts, evidence templates, validators, cleanup scripts, solution quality.",
    ),
    "release": ReviewArea(
        "Release, Deployment, And Smoke Tooling",
        "Release/deployment reviewer",
        "CI workflows, Docker/Kubernetes config, smoke gates, handoff automation.",
    ),
    "docs": ReviewArea(
        "Docs, Runbooks, And Observability",
        "Docs/operations reviewer",
        "Runbooks, release checklists, observability notes, reviewer handoff clarity.",
    ),
    "other": ReviewArea(
        "Other",
        "Owning subsystem reviewer",
        "Paths outside the standard Platform Academy review lanes.",
    ),
}

AREA_ORDER = ("release", "api", "labs", "ui", "docs", "other")
COMMIT_SLICES = {
    "release": {
        "message": "release: add Platform Academy release guardrails",
        "validation": "make smoke-helper-check && make workflow-contract-check",
    },
    "api": {
        "message": "api: persist Platform Academy learning state",
        "validation": "cd apps/api && python3.11 -m pytest",
    },
    "labs": {
        "message": "labs: add runnable Platform Academy labs",
        "validation": "make platform-lab-verify",
    },
    "ui": {
        "message": "frontend: build Platform Academy lab workflows",
        "validation": "make platform-academy-test",
    },
    "docs": {
        "message": "docs: document Platform Academy release handoff",
        "validation": "make doc-link-check",
    },
    "other": {
        "message": "chore: stage remaining Platform Academy changes",
        "validation": "make working-tree-hygiene-check",
    },
}
STATUS_LABELS = {
    "A": "added",
    "C": "copied",
    "D": "deleted",
    "M": "modified",
    "R": "renamed",
    "T": "type changed",
    "U": "unmerged",
    "X": "unknown",
    "??": "untracked",
}


@dataclass(frozen=True)
class ChangedFile:
    path: str
    status: str
    source: str
    area_key: str


def git_lines(*args: str) -> list[str]:
    result = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        check=True,
        stdout=subprocess.PIPE,
        text=True,
    )
    return [line for line in result.stdout.splitlines() if line]


def classify(path: str) -> str:
    if path.startswith(("apps/api/", "apps/worker/", "infra/db/")):
        return "api"
    if path.startswith("apps/platform-academy/"):
        return "ui"
    if path.startswith("labs/platform-academy/"):
        return "labs"
    if path in {".env.example", ".gitignore", "Makefile", "docker-compose.yml"}:
        return "release"
    if path.startswith((".github/", "infra/k8s/", "scripts/")):
        return "release"
    if path == "README.md" or path.startswith(("docs/", "observability/")):
        return "docs"
    return "other"


def parse_name_status(line: str, source: str) -> ChangedFile:
    fields = line.split("\t")
    raw_status = fields[0]
    status = raw_status[0]
    path = fields[-1]
    return ChangedFile(path=path, status=status, source=source, area_key=classify(path))


def changed_files() -> list[ChangedFile]:
    by_path: dict[str, ChangedFile] = {}
    for source, args in (
        ("working tree", ("diff", "--name-status", "--diff-filter=ACMRTUXB", "--")),
        ("index", ("diff", "--cached", "--name-status", "--diff-filter=ACMRTUXB", "--")),
    ):
        for line in git_lines(*args):
            changed = parse_name_status(line, source)
            by_path[changed.path] = changed
    for path in git_lines("ls-files", "--others", "--exclude-standard"):
        by_path[path] = ChangedFile(path=path, status="??", source="untracked", area_key=classify(path))
    return [by_path[path] for path in sorted(by_path)]


def status_label(status: str) -> str:
    return STATUS_LABELS.get(status, status)


def markdown_escape(value: str) -> str:
    return value.replace("|", "\\|")


def print_summary(files_by_area: dict[str, list[ChangedFile]]) -> None:
    print("## Summary")
    print()
    print("| Area | Files | Primary reviewer | Review focus |")
    print("| --- | ---: | --- | --- |")
    for area_key in AREA_ORDER:
        area = AREAS[area_key]
        count = len(files_by_area.get(area_key, []))
        print(f"| {area.name} | {count} | {area.owner} | {area.focus} |")
    print()


def print_area_details(files_by_area: dict[str, list[ChangedFile]]) -> None:
    for area_key in AREA_ORDER:
        files = files_by_area.get(area_key, [])
        if not files:
            continue
        area = AREAS[area_key]
        print(f"## {area.name}")
        print()
        print(f"Primary reviewer: {area.owner}")
        print()
        print("| Status | Source | Path |")
        print("| --- | --- | --- |")
        for changed in files:
            print(
                f"| {status_label(changed.status)} | {changed.source} | "
                f"`{markdown_escape(changed.path)}` |"
            )
        print()


def grouped_files(files: list[ChangedFile]) -> dict[str, list[ChangedFile]]:
    files_by_area: dict[str, list[ChangedFile]] = defaultdict(list)
    for changed in files:
        files_by_area[changed.area_key].append(changed)
    return files_by_area


def pathspec_name(area_key: str) -> str:
    return f"pathspec-{area_key}.txt"


def write_pathspecs(files_by_area: dict[str, list[ChangedFile]], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    for area_key in AREA_ORDER:
        files = files_by_area.get(area_key, [])
        if not files:
            continue
        pathspec = output_dir / pathspec_name(area_key)
        pathspec.write_text("\n".join(changed.path for changed in files) + "\n", encoding="utf-8")


def print_commit_plan(files_by_area: dict[str, list[ChangedFile]], pathspec_dir: Path | None) -> None:
    print("# Platform Academy Commit Plan")
    print()
    print(
        "Use this as a practical split plan if the branch needs staged review commits. "
        "The final integration proof should still be `make platform-release-check` after all slices land."
    )
    print()
    print("| Order | Slice | Files | Suggested commit message | Focused validation |")
    print("| ---: | --- | ---: | --- | --- |")
    order = 1
    for area_key in AREA_ORDER:
        files = files_by_area.get(area_key, [])
        if not files:
            continue
        area = AREAS[area_key]
        commit = COMMIT_SLICES[area_key]
        print(
            f"| {order} | {area.name} | {len(files)} | `{commit['message']}` | "
            f"`{commit['validation']}` |"
        )
        order += 1
    print()
    if pathspec_dir is None:
        print("Run `make platform-review-pack` to generate pathspec files for these slices.")
        return

    print("## Staging Commands")
    print()
    print("Run from the repository root. Commit messages are suggestions; adjust them after review.")
    print()
    print("```bash")
    for area_key in AREA_ORDER:
        files = files_by_area.get(area_key, [])
        if not files:
            continue
        pathspec = (pathspec_dir / pathspec_name(area_key)).as_posix()
        commit = COMMIT_SLICES[area_key]
        print(f"while IFS= read -r file_path; do git add -- \"$file_path\"; done < {pathspec}")
        print(f"git commit -m \"{commit['message']}\"")
        print()
    print("make platform-release-check")
    print("```")
    print()
    print(
        "If you want the lowest-risk review path, use the slice order above. "
        "If you need every intermediate commit independently deployable, keep this as one broad commit."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--commit-plan",
        metavar="PATHSPEC_DIR",
        help="print a commit plan that references pathspec files in PATHSPEC_DIR",
    )
    parser.add_argument(
        "--write-pathspec-dir",
        metavar="DIR",
        help="write one pathspec file per review lane into DIR",
    )
    args = parser.parse_args()

    files = changed_files()
    files_by_area = grouped_files(files)

    if args.write_pathspec_dir:
        write_pathspecs(files_by_area, Path(args.write_pathspec_dir))
        return 0
    if args.commit_plan:
        print_commit_plan(files_by_area, Path(args.commit_plan))
        return 0

    branch = git_lines("rev-parse", "--abbrev-ref", "HEAD")[0]
    commit = git_lines("rev-parse", "--short=12", "HEAD")[0]
    generated_at = datetime.now(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")

    print("# Platform Academy Changed File Review Manifest")
    print()
    print(f"Generated: {generated_at}")
    print(f"Branch: {branch}")
    print(f"Commit: {commit}")
    print(f"Changed files: {len(files)}")
    print()
    print(
        "Use this manifest to split a broad Platform Academy review by subsystem. "
        "It includes modified, staged, and untracked files."
    )
    print()
    print_summary(files_by_area)
    print_area_details(files_by_area)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
