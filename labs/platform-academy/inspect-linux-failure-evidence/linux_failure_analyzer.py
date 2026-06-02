#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the Linux container startup failure lab."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def has_term(label: str, text: str, term: str) -> list[str]:
    return [] if term in text else [f"{label} missing: {term}"]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--describe", required=True, type=Path)
    parser.add_argument("--previous-log", required=True, type=Path)
    parser.add_argument("--id-output", required=True, type=Path)
    parser.add_argument("--remediation", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    describe = args.describe.read_text(encoding="utf-8")
    previous_log = args.previous_log.read_text(encoding="utf-8")
    id_output = args.id_output.read_text(encoding="utf-8")
    remediation = args.remediation.read_text(encoding="utf-8")

    errors: list[str] = []
    errors.extend(has_term("pod-describe.txt", describe, "Reason:       CrashLoopBackOff"))
    errors.extend(has_term("pod-describe.txt", describe, "Exit Code:    126"))
    errors.extend(has_term("pod-describe.txt", describe, "Restart Count:  8"))
    errors.extend(has_term("previous.log", previous_log, "/app/bin/checkout: Permission denied"))
    errors.extend(has_term("previous.log", previous_log, "startup user: uid=10001 gid=10001"))
    errors.extend(has_term("id-output.txt", id_output, "uid=10001(checkout)"))
    errors.extend(has_term("id-output.txt", id_output, "gid=10001(checkout)"))
    errors.extend(has_term("remediation-note.md", remediation, "not application logic or memory pressure"))
    errors.extend(has_term("remediation-note.md", remediation, "Ensure the binary is executable"))
    errors.extend(has_term("remediation-note.md", remediation, "Running as root: hides the permission bug"))

    if "OOMKilled" in describe or re.search(r"Exit Code:\s+137", describe):
        errors.append("describe output should not indicate OOMKilled or exit code 137")
    if "Permission denied" not in previous_log or "uid=10001" not in previous_log:
        errors.append("previous log should connect permission failure to the non-root runtime user")
    if "Increasing memory: no OOM evidence appears" not in remediation:
        errors.append("remediation note should reject memory tuning as the first fix")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("Linux failure evidence analysis passed.")
        print("- Runtime state: checkout is in CrashLoopBackOff after 8 restarts.")
        print("- Exit evidence: last terminated state reports exit code 126.")
        print("- Permission evidence: previous logs show /app/bin/checkout Permission denied.")
        print("- Identity evidence: runtime user is uid=10001(checkout), gid=10001(checkout).")
        print("- Fix target: repair image execute permissions or ownership, then validate as UID 10001.")
        print("- Rejected workaround: do not hide the bug by running the container as root.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
