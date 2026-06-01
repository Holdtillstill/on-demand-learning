# EKS IP Exhaustion Remediation Plan

## Diagnosis

Checkout scale-up failed for two related reasons:

- Nodes are near `maxPods`, so the scheduler reports pod-density pressure.
- AWS VPC CNI cannot assign Pod IPs because `subnet-bbb222` has only seven available IPv4 addresses and prefix delegation is disabled.

## Immediate Action

- Pause the checkout scale-up above current safe capacity.
- Keep existing healthy replicas serving traffic.
- Confirm whether any non-production workloads can be moved or scaled down in the constrained availability zone.
- Do not randomly recycle Pods; that can make IP churn worse.

## Owner Path

- App owner: confirm required checkout replica count and traffic forecast.
- Platform owner: review node group maxPods, instance type, and prefix delegation readiness.
- Network owner: review subnet free IP trend and CIDR expansion options.
- Release owner: hold production rollout until capacity validation passes.

## Medium-Term Fixes

- Enable VPC CNI prefix delegation after compatibility review.
- Use larger or additional subnets for EKS worker nodes.
- Right-size node group instance types and maxPods configuration.
- Add alerting on subnet available IPs and node pod density.

## Validation

- New checkout Pods schedule without `FailedCreatePodSandBox`.
- `aws-node` logs stop reporting failed IP allocation.
- The lowest subnet has enough free IPs for expected burst capacity.
- Node pod density has headroom after the rollout.

## Rollback

If prefix delegation or node-group changes cause instability, disable the change in the sandbox first, restore the prior node group configuration, and keep checkout at the previous replica count while subnet planning continues.
