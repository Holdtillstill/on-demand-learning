# Full Lab: Run an Incident Commander Tabletop

## Goal

Practice incident command for a checkout 5xx event using role assignment, impact statement, mitigation decision, stakeholder update, and timeline discipline.

## Time

45 to 60 minutes.

## Safety

No live incident tooling is required. Use the supplied tabletop signal files and simulator.

## Starting State

```bash
bash labs/platform-academy/run-incident-commander-tabletop/setup.sh --evidence /tmp/incident-commander-evidence.md
sed -n '1,220p' labs/platform-academy/run-incident-commander-tabletop/triage-notes.md
sed -n '1,180p' labs/platform-academy/run-incident-commander-tabletop/signals.md
sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/roles.md
sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/timeline.md
python3 labs/platform-academy/simulator.py --scenario checkout-incident --format logs --events 3
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer or simulator by default. To exercise those from setup after you inspect the packet:

```bash
bash labs/platform-academy/run-incident-commander-tabletop/setup.sh --run-analyzer --run-simulator --evidence /tmp/incident-commander-evidence.md
```

## Investigation

Find:

- The triage False Leads that delay roles, communications, mitigation, or timeline capture.
- Severity and user impact.
- Current mitigation status and next stakeholder update.
- Role assignments.
- Rollback option and decision pressure.
- Timeline gaps.

Run the local incident tabletop analyzer after collecting the packet:

```bash
python3 labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py \
  --signals labs/platform-academy/run-incident-commander-tabletop/signals.md \
  --roles labs/platform-academy/run-incident-commander-tabletop/roles.md \
  --timeline labs/platform-academy/run-incident-commander-tabletop/timeline.md \
  --brief labs/platform-academy/run-incident-commander-tabletop/commander-brief.md \
  --completed-timeline labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md
```

## Remediation Target

Use `commander-brief.md` and `completed-timeline.md` as the target answer.

## Validation

```bash
bash labs/platform-academy/run-incident-commander-tabletop/validate.sh
bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence /tmp/incident-commander-evidence.md
python3 labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py \
  --signals labs/platform-academy/run-incident-commander-tabletop/signals.md \
  --roles labs/platform-academy/run-incident-commander-tabletop/roles.md \
  --timeline labs/platform-academy/run-incident-commander-tabletop/timeline.md \
  --brief labs/platform-academy/run-incident-commander-tabletop/commander-brief.md \
  --completed-timeline labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md
```

## Success Criteria

- You declare or confirm SEV-2.
- You rule out waiting for root cause, delaying stakeholder updates, rolling back without criteria, and writing timeline entries later.
- You assign commander, operations, communications, and planning roles.
- You choose mitigation criteria and next update timing.
- You write timeline entries with evidence, decision, and owner.
- Your evidence includes `Incident commander tabletop analysis passed`.
- Your evidence note names SEV-2 impact, error-rate change, role assignments, rollback criteria, stakeholder update clock, timeline entries, owners, and saved evidence.
