# SLO Incident Decision

## Decision

Treat the alert as user-impacting until the 5xx burn resolves. Collect read-only evidence first, then roll back revision 43 if the rollout correlates with the burn and dependency traces do not dominate.

## Evidence

- Alert has fired for 14 minutes.
- Threshold is 2% 5xx ratio for 10 minutes.
- Revision 43 completed two minutes before readiness flapping.
- Ingress target group crossed unhealthy threshold after readiness began flapping.

## Owner Split

- Incident commander owns severity, timeline, and next update.
- App owner owns revision 43 investigation.
- Platform owner owns rollout, target health, and dashboard/runbook updates.
- Dependency owner is paged only if traces show external errors dominate.

## Follow-Up

Add dashboard correlation between rollout revision, target health, 5xx rate, and dependency error rate.
