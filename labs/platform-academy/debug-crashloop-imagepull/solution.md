# Solution: Separate CrashLoopBackOff from ImagePullBackOff

## Diagnosis

`checkout-crash` pulls a valid `busybox` image, starts, prints `missing DB_URL`, and exits with status 42. That is a runtime crash and should be investigated with `describe`, `lastState`, and `logs --previous`.

`checkout-pull` references `registry.invalid.example/checkout:missing`, so the kubelet cannot pull the image. That is an image resolution or registry ownership problem, and previous logs will not help because the container never started.

## Evidence

Expected evidence:

- `triage-notes.md` rules out restart, resource, node-pressure, and single-owner false leads before splitting the failure modes.
- `checkout-crash` has restart/backoff evidence plus previous logs containing `missing DB_URL`.
- `checkout-pull` has events such as failed pull, pull access denied, DNS failure, or ImagePullBackOff.
- Only the crash case has useful previous container logs.
- `broken-evidence.txt` contains the same split for learners using the no-cluster path.

The local failure-mode analyzer verifies the split without a cluster:

```bash
python3 labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py \
  --start labs/platform-academy/debug-crashloop-imagepull/start.yaml \
  --fixed labs/platform-academy/debug-crashloop-imagepull/fixed.yaml \
  --transcript labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt
```

Expected result: `CrashLoop/ImagePull analysis passed`, with CrashLoop evidence, ImagePull evidence, ownership split, fixed target, and cleanup evidence.

## Fix

The fixed manifest keeps `checkout-crash` alive with a harmless command and changes `checkout-pull` to a pullable `nginx:1.25-alpine` image.

## Handoff Note

A good handoff says: `triage-notes.md` rules out restart and resource false leads. `checkout-crash` started and exited with code 42 after printing `missing DB_URL`, so app config owns that fix. `checkout-pull` never started because `registry.invalid.example/checkout:missing` cannot be pulled, so registry/image ownership comes first and `logs --previous` is not useful for that Pod. Keep the owner split explicit.

## Validation

```bash
bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --cluster
```

Both Deployments should roll out in `payments-debug`.

## Cleanup

```bash
bash labs/platform-academy/debug-crashloop-imagepull/cleanup.sh
```
