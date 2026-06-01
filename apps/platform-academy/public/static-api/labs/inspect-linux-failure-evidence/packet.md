# Inspect Linux failure evidence

Track: Linux
Level: Fresher / Beginner
Lab tier: full
Estimated time: 35 minutes

## Scenario

A container exits repeatedly and you need to decide whether it is an app crash, permission issue, or resource kill.

## Guided run sequence

1. Prepare workspace
   - No cluster required; this lab uses captured describe, log, and id output.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup inspect-linux-failure-evidence
   - bash labs/platform-academy/inspect-linux-failure-evidence/setup.sh --evidence /tmp/linux-failure-evidence.md
2. Investigate safely
   - Capture Last State, exit code, and restart count.
   - Compare previous logs with runtime user evidence.
   - Use the local analyzer to prove runtime state, exit, permission, identity, and rejected workaround evidence.
   - Decide whether this is app crash, permission, or resource pressure.
3. Prove the finding
   - The previous container exited with code 126.
   - Previous logs show Permission denied.
   - The process runs as uid 10001.
   - The remediation note rejects memory tuning and root runtime as first fixes.
4. Reset or hand off
   - bash labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh
   - The captured files are the fallback path.
   - Write the next safest diagnostic command and the likely owner of the fix.

## Evidence artifact map

- `labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt` - Lab artifact
- `labs/platform-academy/inspect-linux-failure-evidence/previous.log` - Captured evidence
- `labs/platform-academy/inspect-linux-failure-evidence/id-output.txt` - Lab artifact
- `labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md` - Decision note
- `labs/platform-academy/inspect-linux-failure-evidence/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py` - Lab artifact
- `labs/platform-academy/inspect-linux-failure-evidence/setup.sh` - Lab artifact
- `labs/platform-academy/inspect-linux-failure-evidence/validate.sh` - Self-check script
- `labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt
- labs/platform-academy/inspect-linux-failure-evidence/previous.log
- labs/platform-academy/inspect-linux-failure-evidence/id-output.txt
- labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md
- labs/platform-academy/inspect-linux-failure-evidence/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py
- labs/platform-academy/inspect-linux-failure-evidence/setup.sh
- labs/platform-academy/inspect-linux-failure-evidence/validate.sh
- labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh

## Worksheet prompts

- [ ] Record the captured pod describe, previous log, id output, namespace, and confirmation that no cluster access is required.
- [ ] Paste `CrashLoopBackOff`, restart count, Last State reason, and exit code 126 evidence.
- [ ] Paste `/app/bin/checkout: Permission denied`, runtime UID/GID, and file-permission hypothesis evidence.
- [ ] Explain why the likely fix is image file permission or ownership, not memory tuning or application logic.
- [ ] Write the remediation owner, rejected root workaround, and validation signal for the fixed image.
- [ ] Capture remediation-note, validation output, cleanup, and no-cluster evidence to save.

## Prerequisites

- [ ] No cluster required; this lab uses captured describe, log, and id output.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup inspect-linux-failure-evidence
- bash labs/platform-academy/inspect-linux-failure-evidence/setup.sh --evidence /tmp/linux-failure-evidence.md
- sed -n '1,180p' labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt
- sed -n '1,120p' labs/platform-academy/inspect-linux-failure-evidence/previous.log

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace inspect-linux-failure-evidence --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip inspect-linux-failure-evidence-learner-workspace.zip
- cd inspect-linux-failure-evidence
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Capture Last State, exit code, and restart count.
- [ ] Compare previous logs with runtime user evidence.
- [ ] Use the local analyzer to prove runtime state, exit, permission, identity, and rejected workaround evidence.
- [ ] Decide whether this is app crash, permission, or resource pressure.

## Runbook commands

- grep -n "Exit Code\|Reason\|Restart Count" labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt
- grep -n "Permission denied\|uid=" labs/platform-academy/inspect-linux-failure-evidence/previous.log labs/platform-academy/inspect-linux-failure-evidence/id-output.txt
- python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md

## Expected evidence

- [ ] The previous container exited with code 126.
- [ ] Previous logs show Permission denied.
- [ ] The process runs as uid 10001.
- [ ] The remediation note rejects memory tuning and root runtime as first fixes.
- [ ] The local analyzer reports Linux failure evidence analysis passed.

## Validation commands

- bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh
- bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence /tmp/linux-failure-evidence.md
- python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md
- grep -n "Running as root: hides the permission bug" labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md

## Validation checks

- [ ] No-cluster evidence boundary recorded
- [ ] CrashLoopBackOff and restart evidence captured
- [ ] Exit code 126 evidence captured
- [ ] Permission denied log and UID evidence captured
- [ ] Wrong fixes rejected
- [ ] Image permission owner and remediation recorded
- [ ] Linux failure analysis, validation output, and cleanup/no-cluster evidence recorded

## Rubric

- [ ] Preserves the captured-evidence/no-cluster safety boundary and names the evidence files.
- [ ] Captures `CrashLoopBackOff`, restart count, Last State, and exit code 126 evidence.
- [ ] Connects `/app/bin/checkout: Permission denied` with runtime user `uid=10001(checkout)`.
- [ ] Rejects memory tuning and app-logic debugging as first fixes because evidence points to permissions.
- [ ] Chooses image file permission or ownership remediation and rejects running as root.
- [ ] Saves remediation note, validation output, cleanup, and no-cluster evidence.

## Cleanup commands

- bash labs/platform-academy/inspect-linux-failure-evidence/cleanup.sh

## No-cluster fallback

- [ ] The captured files are the fallback path.
- [ ] Write the next safest diagnostic command and the likely owner of the fix.
