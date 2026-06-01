# Full Lab: Debug IRSA AccessDenied for a Pod

## Goal

Debug an EKS workload identity failure using local Kubernetes, IAM trust, and CloudTrail evidence. No AWS credentials are required.

## Time

40 to 60 minutes.

## Safety

This lab uses captured evidence. Do not edit live IAM roles or policies from this repo.

## Starting State

```bash
sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml
sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/workload-error.log
sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/trust-policy.json
sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json
cp labs/platform-academy/debug-irsa-access-denied/evidence-template.md /tmp/irsa-access-evidence.md
```

Optional parse check:

```bash
kubectl create --dry-run=client --validate=false -f labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml
```

## Investigation

Find:

- The Kubernetes namespace and ServiceAccount name.
- The IAM role ARN annotation.
- The application-side `AWS_ROLE_ARN` and failed SDK operation.
- The trust policy `sub` condition.
- The denied AWS API action.
- The requested S3 bucket and key path.
- Whether the failure is trust, permission, or both.

## Remediation Target

```bash
sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json
sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json
```

## Validation

```bash
bash labs/platform-academy/debug-irsa-access-denied/validate.sh
bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence /tmp/irsa-access-denied-evidence.md
```

## Success Criteria

- You identify the namespace mismatch in the trust policy.
- You identify `s3:PutObject` as the denied action path.
- You propose a narrow trust and permission fix.
- Your evidence note separates Kubernetes identity, IAM trust, CloudTrail permission, least-privilege scope, owner, and validation evidence.
