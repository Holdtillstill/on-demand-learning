# Checkout SLO Runbook

## Impact

Checkout availability SLO is 99.9% successful API requests over 30 days. `CheckoutHighErrorBudgetBurn` has been firing for 14 minutes because 5xx ratio exceeded 2% for 10 minutes. Users may see failed or delayed checkout attempts.

## Evidence

- Alert: `CheckoutHighErrorBudgetBurn`, severity `page`.
- Dashboard: `https://grafana.example.com/d/checkout`.
- Rollout revision: revision 43 moved `checkout@sha256:bbbb` from canary 10% to canary 100%.
- Kubernetes events: readiness flapping at 10:23:19 and ingress target group unhealthy at 10:25:03.
- Logs/traces: check whether dependency errors dominate before rolling back app code.

## Safe First Commands

```bash
kubectl rollout history deploy/checkout -n payments
kubectl describe deploy/checkout -n payments
kubectl get events -n payments --sort-by=.lastTimestamp
kubectl logs deploy/checkout -n payments --since=15m
```

Save command output before mitigation.

## Mitigation

Rollback criteria:

- Roll back to revision 42 if 5xx started after revision 43 and traces do not show an external dependency as primary cause.
- Reduce traffic if progressive delivery control still exists.
- Escalate to the dependency owner if traces show downstream failures dominate.

Rollback command for an approved responder:

```bash
kubectl rollout undo deploy/checkout -n payments --to-revision=42
kubectl rollout status deploy/checkout -n payments
```

## Validation

- 5xx ratio falls below 2% for 10 minutes.
- Readiness flapping stops.
- Target group health returns to healthy.
- No new saturation alert fires after rollback or traffic shift.

## Follow-up

- App owner: review revision 43 change set by next business day.
- Platform owner: add dashboard panel for rollout revision versus error rate.
- SRE owner: tune alert annotation to link directly to this runbook.
- Incident commander: attach command output and decision log to the incident timeline.
