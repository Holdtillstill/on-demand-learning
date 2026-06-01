# Solution: Write an SLO-Backed Kubernetes Runbook

## Decision

Use the SLO alert as the incident entry point and collect evidence before mitigation. Roll back revision 43 only if evidence points to the rollout rather than a downstream dependency.

## Findings

- `CheckoutHighErrorBudgetBurn` has fired for 14 minutes.
- The alert threshold is 2% 5xx ratio for 10 minutes.
- Rollout revision 43 completed shortly before readiness and target-health symptoms.
- Mitigation choices include rollback, traffic reduction, and dependency-owner escalation.

## Safer Target

`completed-runbook.md` fills impact, evidence, safe first commands, mitigation criteria, validation, and follow-up owners.

`incident-decision.md` captures the decision and owner split.

The local SLO runbook analyzer verifies the incident-ready runbook without a cluster or Prometheus server:

```bash
python3 labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py \
  --signals labs/platform-academy/write-slo-backed-runbook/signals.md \
  --rule labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml \
  --runbook labs/platform-academy/write-slo-backed-runbook/completed-runbook.md \
  --decision labs/platform-academy/write-slo-backed-runbook/incident-decision.md
```

Expected result: `SLO runbook analysis passed`, with alert duration, burn rule, revision 43 correlation, safe first commands, mitigation boundary, validation, and owners.

## Handoff Note

A good handoff says: `CheckoutHighErrorBudgetBurn` has fired for 14 minutes against a 99.9% availability SLO with a 2% 5xx burn threshold. Revision 43 reached 100% shortly before readiness flapping and target-health symptoms, so collect read-only rollout/events/logs evidence first, then roll back to revision 42 only if dependency traces do not dominate.

## Evidence to Save

Save alert state, dashboard link, rollout history, events, logs/traces, local SLO runbook analyzer output, mitigation decision, and post-mitigation validation.

## Cleanup

No cleanup is required for the default local evidence path.
