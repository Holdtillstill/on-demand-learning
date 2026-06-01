# Full Lab: Inspect Linux Failure Evidence

## Goal

Diagnose a container startup failure using Linux exit code, user, and log evidence before changing the workload.

## Time

30 to 45 minutes.

## Safety

This lab uses captured `kubectl describe`, previous logs, and `id` output. No cluster is required.

## Starting State

```bash
bash labs/platform-academy/inspect-linux-failure-evidence/setup.sh --evidence /tmp/linux-failure-evidence.md
sed -n '1,220p' labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt
sed -n '1,120p' labs/platform-academy/inspect-linux-failure-evidence/previous.log
sed -n '1,80p' labs/platform-academy/inspect-linux-failure-evidence/id-output.txt
sed -n '1,160p' labs/platform-academy/inspect-linux-failure-evidence/evidence-template.md
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer by default. Run the local analyzer after you inspect the Linux failure evidence, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/inspect-linux-failure-evidence/linux_failure_analyzer.py \
  --describe labs/platform-academy/inspect-linux-failure-evidence/pod-describe.txt \
  --previous-log labs/platform-academy/inspect-linux-failure-evidence/previous.log \
  --id-output labs/platform-academy/inspect-linux-failure-evidence/id-output.txt \
  --remediation labs/platform-academy/inspect-linux-failure-evidence/remediation-note.md
```

## Investigation

Find:

- Container state and restart count.
- Exit code and reason.
- The exact failing file path.
- The runtime UID/GID.
- Whether the likely fix is command, permission, ownership, or resource sizing.
- Whether the local analyzer confirms permission and identity evidence.
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
- You capture the local Linux failure analyzer result.
- You save the rejected root workaround and no-cluster evidence note.
