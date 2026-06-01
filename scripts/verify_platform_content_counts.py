#!/usr/bin/env python3
"""Verify Platform Academy count constants stay aligned with content."""

from __future__ import annotations

import importlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
sys.path.insert(0, str(API_ROOT))

platform_content = importlib.import_module("app.platform_content")
PLATFORM_COURSES = platform_content.PLATFORM_COURSES
PLATFORM_INTERVIEW_PREP = platform_content.PLATFORM_INTERVIEW_PREP
PLATFORM_LABS = platform_content.PLATFORM_LABS
PLATFORM_RESOURCES = platform_content.PLATFORM_RESOURCES


COUNTS = {
    "COURSES": len(PLATFORM_COURSES),
    "LESSONS": sum(len(course.get("lessons", [])) for course in PLATFORM_COURSES),
    "LABS": len(PLATFORM_LABS),
    "PORTFOLIO_LABS": sum(1 for lab in PLATFORM_LABS if lab.get("portfolio_grade") is True),
    "RESOURCES": len(PLATFORM_RESOURCES),
    "INTERVIEW_PACKS": len(PLATFORM_INTERVIEW_PREP),
    "INTERVIEW_QUESTIONS": sum(len(pack.get("questions", [])) for pack in PLATFORM_INTERVIEW_PREP),
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require_regex(path: str, pattern: str, label: str) -> None:
    if re.search(pattern, read(path), flags=re.MULTILINE) is None:
        fail(f"{path} missing {label}")


def require_text(path: str, text: str) -> None:
    if text not in read(path):
        fail(f"{path} missing expected count text: {text}")


def verify_shell_defaults() -> None:
    api_script = "scripts/smoke_platform_academy_api.sh"
    for name, value in COUNTS.items():
        require_regex(
            api_script,
            rf'^EXPECTED_{name}="\$\{{EXPECTED_{name}:-{value}\}}"$',
            f"EXPECTED_{name} default {value}",
        )

    lab_script = "scripts/smoke_platform_academy_labs.sh"
    for name in ("LABS", "PORTFOLIO_LABS"):
        value = COUNTS[name]
        require_regex(
            lab_script,
            rf'^EXPECTED_{name}="\$\{{EXPECTED_{name}:-{value}\}}"$',
            f"EXPECTED_{name} default {value}",
        )


def verify_browser_defaults() -> None:
    smoke_routes = "apps/platform-academy/scripts/smoke-routes.mjs"
    for name, value in COUNTS.items():
        require_regex(
            smoke_routes,
            rf'^const EXPECTED_{name} = readPositiveInteger\("SMOKE_EXPECTED_{name}", "EXPECTED_{name}", {value}\);$',
            f"EXPECTED_{name} browser default {value}",
        )


def verify_count_docs() -> None:
    courses = COUNTS["COURSES"]
    lessons = COUNTS["LESSONS"]
    labs = COUNTS["LABS"]
    portfolio = COUNTS["PORTFOLIO_LABS"]
    resources = COUNTS["RESOURCES"]
    packs = COUNTS["INTERVIEW_PACKS"]
    questions = COUNTS["INTERVIEW_QUESTIONS"]

    require_text("docs/deployment.md", f"- {courses} courses")
    require_text("docs/deployment.md", f"- {lessons} lessons")
    require_text("docs/deployment.md", f"- {labs} labs")
    require_text("docs/deployment.md", f"- {portfolio} portfolio-grade labs")
    require_text("docs/deployment.md", f"- {resources} resources")
    require_text("docs/deployment.md", f"- {questions} interview questions")
    require_text("docs/deployment.md", f"`{courses} courses / {lessons} lessons`")
    require_text("docs/deployment.md", f"`/labs` renders {labs} labs")
    require_text("docs/deployment.md", f"`/resources` renders {resources} resources")

    require_text(
        "docs/platform-academy.md",
        f"Current seed count: {courses} courses, {lessons} lessons, {labs} labs, "
        f"{resources} reusable resources, and {questions} interview questions.",
    )

    require_text(
        "docs/smoke-test-checklist.md",
        f"`/dashboard/home` shows {courses} courses, {lessons} lessons, {labs} labs, "
        f"{resources} resources, and {questions} interview questions.",
    )

    release_gate_text = (
        f"{courses} courses, {lessons} lessons, {labs} full labs, {portfolio} portfolio-grade lab UI signals, "
        f"{resources} resources, {packs} interview prep packs, {questions} interview questions"
    )
    require_text("docs/release-checklist.md", release_gate_text)

    browser_scope_text = (
        f"Browser smoke: {courses} courses, {lessons} lessons, {labs} lab detail routes, "
        f"{portfolio} portfolio-grade UI signals, {resources} resource detail routes, "
        f"{packs} interview prep packs, desktop and mobile route checks."
    )
    require_text("scripts/platform_release_evidence.sh", browser_scope_text)


def main() -> None:
    verify_shell_defaults()
    verify_browser_defaults()
    verify_count_docs()
    print(
        "Verified Platform Academy content counts: "
        f"courses={COUNTS['COURSES']}, lessons={COUNTS['LESSONS']}, labs={COUNTS['LABS']}, "
        f"portfolio={COUNTS['PORTFOLIO_LABS']}, resources={COUNTS['RESOURCES']}, "
        f"packs={COUNTS['INTERVIEW_PACKS']}, questions={COUNTS['INTERVIEW_QUESTIONS']}."
    )


if __name__ == "__main__":
    main()
