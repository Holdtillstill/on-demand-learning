# Platform Engineering Artifact: Kubernetes Service Debugging and Release Safety

## Problem

A checkout Service returned intermittent 503s after a label cleanup, and the same team wanted faster production releases without clear artifact promotion evidence.

## Environment

Local repository-backed Platform Academy labs only. Kubernetes examples use disposable namespaces or captured evidence. AWS and production commands are treated as review artifacts, not live mutation.

## Commands And Validation

```bash
kubectl describe svc checkout -n payments
kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout
diff -u labs/platform-academy/design-safe-release-pipeline/pipeline.yaml labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml
bash labs/platform-academy/verify-full-labs.sh
```

Validation notes:

- Service selector did not match ready Pod labels.
- EndpointSlice had no usable addresses until labels and selectors were aligned.
- Unsafe pipeline deployed from `main` directly to production without digest promotion, scan, SBOM, staging, smoke, canary, or rollback gates.
- Full-lab verifier validated the local lab contract after remediation.

## Decision

Fix the Service selector path before changing workloads. For release safety, block push-to-prod until the pipeline promotes immutable image digests and requires scan, SBOM, manifest validation, staging smoke test, production approval, canary, and rollback checks.

## Validation

```bash
bash labs/platform-academy/trace-service-to-pod/validate.sh
bash labs/platform-academy/design-safe-release-pipeline/validate.sh
```

Validation covers both the Kubernetes debug path and the release review target.

## Rollback

For the Service lab, reapply the starting manifest or delete the disposable namespace. For the release pipeline, continue using the existing manual process until the safer workflow is reviewed and tested in staging.

## Technical Talking Points

- I collect read-only evidence before changing cluster state.
- I tie debugging to user impact, owner, blast radius, and rollback.
- I treat CI/CD as a production control plane, not just automation.
- I can explain why digest promotion and staged smoke tests reduce release risk.
