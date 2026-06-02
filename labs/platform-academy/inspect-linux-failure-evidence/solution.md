# Solution: Inspect Linux Failure Evidence

## Decision

Fix image file permissions and ownership; do not tune memory or run the container as root.

`triage-notes.md` False Leads rule out treating exit code 126 as memory pressure, relying on restart count alone, using chmod in a live container, running as root, or debugging application logic before checking permissions.

## Findings

- Pod is in `CrashLoopBackOff`.
- Last exit code is `126`.
- Previous logs show `/app/bin/checkout: Permission denied`.
- Runtime user is UID/GID 10001.
- The container exits before listening on `:8080`.

The local Linux failure analyzer verifies the evidence chain without a cluster:

```bash
python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py \
  --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt \
  --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log \
  --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt \
  --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md
```

Expected result: `Linux failure evidence analysis passed`, with runtime state, exit, permission, identity, fix-target, and rejected-root evidence.

## Evidence to Save

Save the describe output, previous logs, runtime identity, diagnosis, rejected root and memory fixes, validation command, and no-cluster note in `evidence-template.md`.

## Cleanup

No cleanup is required for the default evidence-review path.
