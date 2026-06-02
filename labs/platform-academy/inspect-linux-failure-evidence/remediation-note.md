# Linux Failure Remediation Note

## Diagnosis

The checkout container is in `CrashLoopBackOff` because `/app/bin/checkout` cannot execute. Exit code `126` and `Permission denied` point to file mode or ownership, not application logic or memory pressure.

## Evidence

- Last terminated state: `Exit Code: 126`.
- Previous log: `/app/start.sh: line 4: /app/bin/checkout: Permission denied`.
- Runtime user: `uid=10001(checkout)`.
- Restart count: `8`.

## Safe Fix

- Inspect the image build step that copies `/app/bin/checkout`.
- Ensure the binary is executable before image publication.
- Ensure ownership permits UID 10001 to execute it.
- Rebuild and promote by digest after validation.

## Rejected Fixes

- Increasing memory: no OOM evidence appears.
- Restarting Pods repeatedly: does not change file permissions.
- Running as root: hides the permission bug and weakens runtime security.

## Validation

Run the container as UID 10001 and execute `/app/bin/checkout --version` or a startup smoke test before deployment.
