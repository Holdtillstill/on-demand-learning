# Solution: Debug IRSA AccessDenied for a Pod

## Diagnosis

The ServiceAccount is `system:serviceaccount:payments:checkout`, and `workload-error.log` shows the runtime identity variables: `serviceAccountName=checkout` and `AWS_ROLE_ARN=arn:aws:iam::111122223333:role/payments-checkout-readonly`.

The trust policy allows `system:serviceaccount:default:checkout`. That means the role trust does not match the workload identity shown in Kubernetes.

The application SDK log shows a botocore `AccessDenied` when calling `PutObject`. CloudTrail also shows an `AccessDenied` on S3 `PutObject` for bucket `payments-prod-receipts`, key prefix `receipts/2026/05/30/`. The role name includes `readonly`, so the policy likely lacks write permission even after trust is corrected.

## Fix

Use a trust condition scoped to:

```text
system:serviceaccount:payments:checkout
```

Then add the narrow permission needed by the workload:

```text
s3:PutObject arn:aws:s3:::payments-prod-receipts/receipts/*
```

The local simulator verifies both pieces without AWS credentials:

```bash
python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py \
  --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml \
  --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json \
  --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json \
  --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json \
  --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json
```

## What Not To Do

Do not use wildcard service accounts, wildcard namespaces, or `s3:*` on the whole bucket unless a separate review explicitly approves that blast radius.

## Handoff Note

A good handoff says: Kubernetes shows `payments/checkout` annotated to assume `payments-checkout-readonly`, `workload-error.log` shows the runtime `AWS_ROLE_ARN` and botocore `AccessDenied`, but IAM trust allows `system:serviceaccount:default:checkout`. CloudTrail separately shows `AccessDenied` for `s3:PutObject` to `payments-prod-receipts/receipts/...`, and the simulator proves the proposed fix needs both exact trust subject and narrow object-prefix write permission.

## Cleanup

No cleanup is required for the default evidence-review path.
