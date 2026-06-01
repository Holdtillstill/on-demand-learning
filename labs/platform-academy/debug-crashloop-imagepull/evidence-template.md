# Evidence Template: Separate CrashLoopBackOff From ImagePullBackOff

## Scope And Safety

- Cluster/context:
- Namespace:
- Manifest reviewed:
- Cleanup command:

## Failure Classification

| Workload | Current status | Started container? | Best first evidence |
| --- | --- | --- | --- |
| checkout-crash | | | |
| checkout-pull | | | |

## Triage Notes And False Leads

- Triage notes reviewed:
- Restart or resource false lead ruled out:
- Container that never started:
- Owner split clue:

## CrashLoopBackOff Evidence

- `describe` signal:
- Last State and exit code:
- Previous logs:
- Likely owner:
- Fix path:

## ImagePullBackOff Evidence

- Image reference:
- Event reason:
- Registry or pull-secret hypothesis:
- Likely owner:
- Fix path:

## Decision

- Local failure-mode analyzer result:
- App/config action:
- Image/registry action:
- Rollback or mitigation:
- Evidence to save in incident handoff:

## Validation And Cleanup

- Validation command:
- Rollout result:
- Cleanup result or no-cluster fallback note:
