# Evidence Template: Debug IRSA AccessDenied For A Pod

## Scope And Safety

- Evidence source:
- Namespace:
- ServiceAccount:
- IAM role ARN:
- Confirmation that no live IAM changes are being made:

## Kubernetes Identity Evidence

- ServiceAccount manifest path:
- Workload error log path:
- Namespace/name:
- Pod `serviceAccountName`:
- Annotated role ARN:
- Runtime `AWS_ROLE_ARN`:

## Application Error Evidence

- Failed SDK operation:
- Error text:
- Bucket/key from application log:
- Why logs alone do not prove the trust policy is correct:

## Trust Policy Evidence

- Trust policy subject:
- Expected subject:
- Namespace mismatch:
- Why wildcard trust is not acceptable:

## CloudTrail Permission Evidence

- Denied action:
- Error code:
- Assumed role:
- Bucket:
- Object key or prefix:

## Fix Decision

- Trust policy change:
- Permission policy change:
- Least-privilege resource scope:
- Local simulator result:
- Owner:
- Validation or rollout handoff:
