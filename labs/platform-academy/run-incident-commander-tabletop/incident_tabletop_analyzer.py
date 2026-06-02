#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the incident commander tabletop packet."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def missing_terms(label: str, text: str, terms: list[str]) -> list[str]:
    missing = [term for term in terms if term not in text]
    return [f"{label} missing: {', '.join(missing)}"] if missing else []


def table_rows(markdown: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in markdown.splitlines():
        if not line.startswith("|") or line.startswith("| ---"):
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if cells and cells[0] != "Time":
            rows.append(cells)
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--signals", required=True, type=Path)
    parser.add_argument("--roles", required=True, type=Path)
    parser.add_argument("--timeline", required=True, type=Path)
    parser.add_argument("--brief", required=True, type=Path)
    parser.add_argument("--completed-timeline", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    signals = args.signals.read_text(encoding="utf-8")
    roles = args.roles.read_text(encoding="utf-8")
    timeline = args.timeline.read_text(encoding="utf-8")
    brief = args.brief.read_text(encoding="utf-8")
    completed = args.completed_timeline.read_text(encoding="utf-8")
    completed_rows = table_rows(completed)

    errors: list[str] = []
    errors.extend(
        missing_terms(
            "signals.md",
            signals,
            [
                "Checkout 5xx rate rose from 0.2% to 9.4%",
                "payment confirmation intermittently fails",
                "SEV-2 declared",
                "revision 43 promoted to 100%",
                "rollback option identified: revision 42",
                "Next stakeholder update due in 15 minutes",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "roles.md",
            roles,
            ["Incident commander", "Operations lead", "Communications lead", "Planning lead"],
        )
    )
    errors.extend(
        missing_terms(
            "commander-brief.md",
            brief,
            [
                "SEV-2",
                "Rollback revision 43",
                "within five minutes",
                "Send stakeholder update within 15 minutes",
                "do not delay user-impact mitigation indefinitely",
            ],
        )
    )
    errors.extend(
        missing_terms(
            "completed-timeline.md",
            completed,
            [
                "Declare SEV-2",
                "revision 42 known good",
                "Communications drafts update",
                "Roll back if no drop in 5 minutes",
            ],
        )
    )

    if "Pending approval" not in timeline:
        errors.append("timeline.md should preserve the initial unresolved rollback decision")
    if len(completed_rows) < 6:
        errors.append("completed-timeline.md should include at least six timeline decision entries")
    for row in completed_rows:
        if len(row) != 5 or not all(row):
            errors.append("completed-timeline.md rows should include time, event, evidence, decision, and owner")
            break
    owners = " ".join(row[4] for row in completed_rows if len(row) >= 5)
    for owner in ["Release owner", "Operations lead", "Incident commander", "Communications lead"]:
        if owner not in owners:
            errors.append(f"completed-timeline.md missing owner: {owner}")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Incident commander tabletop analysis passed.")
        print("- Severity: SEV-2 is justified by checkout 5xx rising from 0.2% to 9.4%.")
        print("- Impact: payment confirmation intermittently fails after revision 43 reached 100%.")
        print("- Roles: commander, operations, communications, and planning leads are assigned.")
        print("- Mitigation: rollback revision 43 to known-good revision 42 if impact does not drop in five minutes.")
        print("- Communications: stakeholder update clock is set to 15 minutes.")
        print("- Timeline: decisions have time, evidence, owner, and handoff entries.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
