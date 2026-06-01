# Linux Failure Evidence Triage Notes

## False Leads Ruled Out

- Exit code 126 is not memory pressure; it means the command was found but could not execute.
- Previous logs are stronger than restart count; restart count alone only proves the failure is repeating.
- Running as root hides the permission bug and weakens the container security boundary.
- chmod in a live container is not durable because the next Pod starts from the unchanged image.
- Application logic debugging is premature until the failing executable path and runtime identity are connected.

## Strong Evidence

- `pod-describe.txt` shows `CrashLoopBackOff`, `Restart Count:  8`, and `Exit Code:    126`.
- `previous.log` shows `/app/bin/checkout: Permission denied`.
- `id-output.txt` shows `uid=10001(checkout)` and `gid=10001(checkout)`.
- `remediation-note.md` rejects memory tuning and root runtime as first fixes.

## Decision Trap

Do not treat every crash loop as an app bug or resource issue. The evidence points to image file permissions or ownership, so the durable fix belongs in the image build or artifact packaging path.
