# Full Lab: Inspect Linux Failure Evidence

## Goal

Diagnose a container startup failure using Linux exit code, user, and log evidence before changing the workload.

## Time

30 to 45 minutes.

## Safety

This lab uses captured `kubectl describe`, previous logs, and `id` output. No cluster is required.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt
sed -n '1,120p' labs/platform-academy/inspect-linux-failure-evidence/previous.log
sed -n '1,80p' labs/platform-academy/inspect-linux-failure-evidence/id-output.txt
sed -n '1,160p' labs/platform-academy/inspect-linux-failure-evidence/evidence-template.md
```

## Investigation

Find:

- Container state and restart count.
- Exit code and reason.
- The exact failing file path.
- The runtime UID/GID.
- Whether the likely fix is command, permission, ownership, or resource sizing.
- Which workaround is rejected and which validation output proves the fix path.

## Remediation Target

Use `remediation-note.md` and `solution.md` as the target answer.

## Validation

```bash
bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh
bash labs/platform-academy/inspect-linux-failure-evidence/validate.sh --evidence /tmp/linux-failure-evidence.md
```

## Success Criteria

- You diagnose exit code 126 as a permission/execute problem.
- You connect `/app/bin/checkout: Permission denied` with runtime user `10001`.
- You reject memory tuning as the first fix because the evidence points to permissions.
- You save the rejected root workaround and no-cluster evidence note.
