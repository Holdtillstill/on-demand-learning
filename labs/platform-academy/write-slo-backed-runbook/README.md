# Full Lab: Write an SLO-Backed Kubernetes Runbook

## Goal

Turn an error-budget burn alert into an incident-ready Kubernetes runbook with evidence, mitigation criteria, validation, rollback, and follow-up ownership.

## Time

45 to 60 minutes.

## Safety

No cluster or Prometheus server is required. Use the supplied alert rule and signal packet as local evidence. Do not run rollback commands against a live workload from this lab.

## Starting State

Inspect the SLO signal packet and runbook template:

```bash
bash labs/platform-academy/write-slo-backed-runbook/setup.sh --evidence /tmp/slo-runbook-evidence.md
sed -n '1,220p' labs/platform-academy/write-slo-backed-runbook/signals.md
sed -n '1,220p' labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml
sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/runbook-template.md
```

Compare the template with the completed runbook:

```bash
diff -u labs/platform-academy/write-slo-backed-runbook/runbook-template.md labs/platform-academy/write-slo-backed-runbook/completed-runbook.md || true
```

Run the local analyzer:

```bash
python3 labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py \
  --signals labs/platform-academy/write-slo-backed-runbook/signals.md \
  --rule labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml \
  --runbook labs/platform-academy/write-slo-backed-runbook/completed-runbook.md \
  --decision labs/platform-academy/write-slo-backed-runbook/incident-decision.md
```

## Investigation

Find:

- The user-visible symptom and SLO window.
- The alert threshold and duration.
- The rollout revision correlated with the alert.
- The safe first commands.
- Rollback, traffic-shift, and escalation criteria.
- Follow-up owners and alert/dashboard changes.
- Whether the local analyzer connects the burn alert, rollout correlation, safe commands, rollback boundary, and owners.

## Remediation Target

Use `completed-runbook.md` and `incident-decision.md` as the target answer.

## Validation

```bash
bash labs/platform-academy/write-slo-backed-runbook/validate.sh
bash labs/platform-academy/write-slo-backed-runbook/validate.sh --evidence /tmp/slo-runbook-evidence.md
```

## Success Criteria

- You connect the alert to user impact and error-budget burn.
- You choose read-only evidence before mitigation.
- You define rollback criteria tied to revision 43 and target health.
- You include follow-up owners, due dates, and alert/dashboard improvements.
- You use analyzer output as evidence for the runbook decision.
- Your evidence note names SLO target, burn threshold, alert duration, rollout revision, symptoms, safe commands, mitigation criteria, owners, validation, and saved evidence.
