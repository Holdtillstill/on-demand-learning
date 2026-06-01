# Full Lab: Run an Incident Commander Tabletop

## Goal

Practice incident command for a checkout 5xx event using role assignment, impact statement, mitigation decision, stakeholder update, and timeline discipline.

## Time

45 to 60 minutes.

## Safety

No live incident tooling is required. Use the supplied tabletop signal files and simulator.

## Starting State

```bash
sed -n '1,180p' labs/platform-academy/run-incident-commander-tabletop/signals.md
sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/roles.md
sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/timeline.md
python3 labs/platform-academy/simulator.py --scenario checkout-incident --format logs --events 3
cp labs/platform-academy/run-incident-commander-tabletop/evidence-template.md /tmp/incident-commander-evidence.md
```

## Investigation

Find:

- Severity and user impact.
- Current mitigation status and next stakeholder update.
- Role assignments.
- Rollback option and decision pressure.
- Timeline gaps.

## Remediation Target

Use `commander-brief.md` and `completed-timeline.md` as the target answer.

## Validation

```bash
bash labs/platform-academy/run-incident-commander-tabletop/validate.sh
bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence /tmp/incident-commander-evidence.md
```

## Success Criteria

- You declare or confirm SEV-2.
- You assign commander, operations, communications, and planning roles.
- You choose mitigation criteria and next update timing.
- You write timeline entries with evidence, decision, and owner.
- Your evidence note names SEV-2 impact, error-rate change, role assignments, rollback criteria, stakeholder update clock, timeline entries, owners, and saved evidence.
