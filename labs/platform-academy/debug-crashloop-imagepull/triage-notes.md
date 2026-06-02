# Triage Notes: Two Pod Failures After Checkout Release

## Evidence Source

These notes are a captured on-call handoff for the CrashLoopBackOff and ImagePullBackOff lab. Use them with `broken-evidence.txt` when you do not have a disposable cluster.

## Timeline

- 09:18 UTC: Checkout debug namespace was created for a release rehearsal.
- 09:20 UTC: `checkout-crash` reached `CrashLoopBackOff` after several restarts.
- 09:21 UTC: `checkout-pull` reached `ErrImagePull`, then `ImagePullBackOff`.
- 09:23 UTC: Restarting Pods did not change either failure mode.
- 09:25 UTC: Node pressure and cluster DNS alerts were checked and were not active.

## False Leads Ruled Out

- Increasing CPU or memory is not supported by the evidence; `checkout-crash` exits with code 42.
- Pulling previous logs from `checkout-pull` is not useful because that container never started.
- Restarting the Deployment is not a fix when the manifest still contains a bad command and invalid image reference.
- Treating both Pods as one outage hides the owner split.

## Strongest Clues

- `checkout-crash` started, exited, and left previous logs with `missing DB_URL`.
- `checkout-pull` never started because `registry.invalid.example/checkout:missing` cannot be resolved.
- App/config owns the crash fix; image/registry ownership owns the pull failure.

## Evidence To Save

- Current status for both Pods.
- Last State, exit code 42, and previous logs for `checkout-crash`.
- Image reference and `ErrImagePull` or `ImagePullBackOff` events for `checkout-pull`.
- Separate owner actions and rollout validation for both fixed Deployments.
- Cleanup result or no-cluster fallback note.
