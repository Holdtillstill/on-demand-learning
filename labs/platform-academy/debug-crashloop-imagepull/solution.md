# Solution: Separate CrashLoopBackOff from ImagePullBackOff

## Diagnosis

`checkout-crash` pulls a valid `busybox` image, starts, prints `missing DB_URL`, and exits with status 42. That is a runtime crash and should be investigated with `describe`, `lastState`, and `logs --previous`.

`checkout-pull` references `registry.invalid.example/checkout:missing`, so the kubelet cannot pull the image. That is an image resolution or registry ownership problem, and previous logs will not help because the container never started.

## Evidence

Expected evidence:

- `checkout-crash` has restart/backoff evidence plus previous logs containing `missing DB_URL`.
- `checkout-pull` has events such as failed pull, pull access denied, DNS failure, or ImagePullBackOff.
- Only the crash case has useful previous container logs.
- `broken-evidence.txt` contains the same split for learners using the no-cluster path.

## Fix

The fixed manifest keeps `checkout-crash` alive with a harmless command and changes `checkout-pull` to a pullable `nginx:1.25-alpine` image.

## Handoff Note

A good handoff says: `checkout-crash` started and exited with code 42 after printing `missing DB_URL`, so app config owns that fix. `checkout-pull` never started because `registry.invalid.example/checkout:missing` cannot be pulled, so registry/image ownership comes first and `logs --previous` is not useful for that Pod.

## Validation

```bash
bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --cluster
```

Both Deployments should roll out in `payments-debug`.

## Cleanup

```bash
bash labs/platform-academy/debug-crashloop-imagepull/cleanup.sh
```
