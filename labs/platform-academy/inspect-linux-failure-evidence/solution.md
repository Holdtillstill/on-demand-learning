# Solution: Inspect Linux Failure Evidence

## Decision

Fix image file permissions and ownership; do not tune memory or run the container as root.

## Findings

- Pod is in `CrashLoopBackOff`.
- Last exit code is `126`.
- Previous logs show `/app/bin/checkout: Permission denied`.
- Runtime user is UID/GID 10001.
- The container exits before listening on `:8080`.

## Evidence to Save

Save the describe output, previous logs, runtime identity, diagnosis, rejected root and memory fixes, validation command, and no-cluster note in `evidence-template.md`.

## Cleanup

No cleanup is required for the default evidence-review path.
