# Full Lab: Separate CrashLoopBackOff from ImagePullBackOff

## Goal

Practice reading Kubernetes failure evidence without mixing up two different failure modes:

- A container that starts, exits, and enters `CrashLoopBackOff`.
- A container image that never pulls and enters `ErrImagePull` or `ImagePullBackOff`.

## Time

35 to 50 minutes.

## Safety

Use a disposable local cluster. The lab creates the `payments-debug` namespace and includes a cleanup script.

## Starting State

Check cluster readiness before mutating anything:

```bash
bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --preflight
```

```bash
bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --cluster
```

Equivalent manual setup:

```bash
kubectl config current-context
kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/start.yaml
kubectl get pods -n payments-debug
```

One Deployment intentionally exits with code 42. The other references an invalid registry.
The preflight/setup path creates or recreates the `payments-debug` namespace; the learner does not need an app namespace or Pods running ahead of time.

No-cluster path:

```bash
bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md
```

Run the local analyzer:

```bash
python3 labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py \
  --start labs/platform-academy/debug-crashloop-imagepull/start.yaml \
  --fixed labs/platform-academy/debug-crashloop-imagepull/fixed.yaml \
  --transcript labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt
```

## Investigation

Run:

```bash
kubectl describe pods -n payments-debug -l app=checkout-crash
kubectl logs -n payments-debug -l app=checkout-crash --previous
kubectl describe pods -n payments-debug -l app=checkout-pull
kubectl get events -n payments-debug --sort-by=.lastTimestamp
```

Write down which signal came from Pod status, which came from events, and which came from previous logs.
If you are using the no-cluster transcript, classify the same signals from `broken-evidence.txt`.
Use the analyzer output to verify that you separated runtime-crash evidence from image-pull evidence.

## Fix

```bash
kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/fixed.yaml
kubectl rollout status deploy/checkout-crash -n payments-debug --timeout=90s
kubectl rollout status deploy/checkout-pull -n payments-debug --timeout=90s
```

## Validation

```bash
bash labs/platform-academy/debug-crashloop-imagepull/validate.sh
```

Evidence-note validation:

```bash
bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --evidence /tmp/crashloop-imagepull-evidence.md
```

Use `--cluster` to apply and verify the fixed manifest in a local cluster.

## Success Criteria

- You can explain why previous logs help for CrashLoopBackOff.
- You can explain why image pull events matter before logs exist.
- You captured the local failure-mode analyzer result.
- You assign the fixes to the right owner: app/config for the crash, registry/image reference for the pull failure.
- Your evidence note separates current status, last state, previous logs, image reference, event reason, owner, fix, validation, and cleanup.
