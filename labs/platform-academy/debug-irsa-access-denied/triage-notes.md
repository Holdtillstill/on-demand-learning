# Triage Notes: IRSA Role Assumption And S3 Write Denied

## Evidence Source

These notes are a captured identity handoff for the IRSA AccessDenied lab. Use them with the ServiceAccount, workload log, trust policy, CloudTrail event, and least-privilege policy when you do not have AWS credentials.

## Timeline

- 11:02 UTC: Checkout receipts writer was moved into namespace `payments`.
- 11:05 UTC: The Pod reported `AWS_ROLE_ARN=arn:aws:iam::111122223333:role/payments-checkout-readonly`.
- 11:07 UTC: Application logs showed botocore `AccessDenied` during `PutObject`.
- 11:09 UTC: Trust policy review found the allowed subject still pointed at `system:serviceaccount:default:checkout`.
- 11:12 UTC: CloudTrail confirmed a separate S3 `PutObject` denial for the receipts prefix.

## False Leads Ruled Out

- Restarting the Pod is not a fix because the ServiceAccount and IAM trust policy still disagree.
- Rotating projected service account tokens is not the first fix because the subject claim would still be wrong.
- Bucket policy alone is not enough evidence; the role trust mismatch must be fixed before assuming permission scope is the only problem.
- Wildcard trust or `s3:*` would hide the owner split and create unnecessary blast radius.

## Strongest Clues

- Kubernetes identity is `system:serviceaccount:payments:checkout`.
- Broken IAM trust allows `system:serviceaccount:default:checkout`.
- CloudTrail shows `AccessDenied` for `s3:PutObject` on `payments-prod-receipts/receipts/...`.
- The correct handoff separates IAM trust ownership from least-privilege permission ownership.

## Evidence To Save

- ServiceAccount namespace/name and role annotation.
- Runtime `AWS_ROLE_ARN` and application SDK error.
- Broken and fixed trust subjects.
- CloudTrail denied action, bucket, and key prefix.
- Simulator result, owner split, wildcard rejection, and rollout handoff.
