# Completed Timeline

| Time | Event | Evidence | Decision | Owner |
| --- | --- | --- | --- | --- |
| 10:57 | Canary promoted | rollout revision 43 | Monitor SLO | Release owner |
| 11:01 | Readiness flapping | 7/12 Pods flapping | Begin diagnostics | Operations lead |
| 11:04 | 5xx page fires | 9.4% checkout 5xx | Declare SEV-2 | Incident commander |
| 11:06 | Rollback available | revision 42 known good | Prepare rollback | Operations lead |
| 11:08 | Stakeholder clock set | update due in 15 minutes | Communications drafts update | Communications lead |
| 11:09 | Mitigation criterion set | impact persists after canary | Roll back if no drop in 5 minutes | Incident commander |
