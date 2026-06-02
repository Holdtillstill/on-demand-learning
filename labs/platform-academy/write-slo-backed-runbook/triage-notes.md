# Triage Notes: SLO Burn Runbook Review

## Evidence Source

These notes are a captured on-call review packet for the SLO-backed runbook lab. Use them with `signals.md`, `prometheus-rule.yaml`, `runbook-template.md`, `completed-runbook.md`, and `incident-decision.md` when no cluster or Prometheus server is available.

## Timeline

- 09:04 UTC: `CheckoutHighErrorBudgetBurn` started paging for checkout availability.
- 09:14 UTC: The alert passed the 10-minute rule duration and continued firing.
- 09:18 UTC: The signal packet showed 14 minutes of burn against the 99.9% availability SLO.
- 09:20 UTC: Revision 43 was identified as the most recent rollout reaching 100%.
- 09:23 UTC: Readiness flapping and target-health symptoms were confirmed, but dependency traces still needed review.
- 09:28 UTC: Runbook review required read-only evidence before rollback, traffic shift, or escalation.

## False Leads Ruled Out

- Rollback is not the first command just because the SLO burn alert is firing.
- Revision 43 correlation is not proof by itself; dependency traces still need a quick check.
- A 5xx threshold alone is not enough without user impact, SLO window, and dashboard context.
- Readiness flapping should not hide target-health evidence from the load balancer path.
- Follow-up ownership is not optional after mitigation; alert, dashboard, and runbook improvements need owners.

## Strongest Clues

- The service is burning a 99.9% checkout availability SLO.
- `CheckoutHighErrorBudgetBurn` has fired for 14 minutes with a 2% 5xx threshold.
- Revision 43 reached 100% shortly before readiness and target-health symptoms.
- Safe first commands are read-only: rollout history, describe, events, logs, and trace checks.
- Rollback to revision 42 is allowed only when dependency evidence does not dominate.

## Evidence To Save

- SLO target, alert threshold, rule duration, alert duration, dashboard, and user impact.
- Revision 43 timing, readiness flapping, target-health evidence, and dependency check status.
- Safe first commands, rollback or traffic-shift criteria, escalation owner, validation signal, and follow-up owners.
- Analyzer output, incident decision, validation, cleanup or no-runtime note, and saved evidence list.
