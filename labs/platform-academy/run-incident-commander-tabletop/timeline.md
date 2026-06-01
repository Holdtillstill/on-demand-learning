# Timeline

| Time | Event | Evidence | Decision | Owner |
| --- | --- | --- | --- | --- |
| 10:57 | Canary promoted | rollout revision 43 | Monitor SLO | Release owner |
| 11:01 | Readiness flapping | Pod events | Investigate | Operations |
| 11:04 | 5xx page fires | SLO alert | Declare SEV-2 | Incident commander |
| 11:06 | Rollback available | rollout history | Pending approval | Incident commander |
