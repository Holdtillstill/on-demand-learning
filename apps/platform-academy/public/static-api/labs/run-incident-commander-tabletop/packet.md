# Run an incident commander tabletop

Track: Incident Response
Level: Advanced
Lab tier: full
Estimated time: 60 minutes

## Scenario

A canary release causes elevated checkout errors and the team needs coordinated mitigation, communication, and timeline discipline.

## Guided run sequence

1. Prepare workspace
   - No cluster required; this tabletop uses local incident signal files and a local signal simulator.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup run-incident-commander-tabletop
   - bash labs/platform-academy/run-incident-commander-tabletop/setup.sh --evidence /tmp/incident-commander-evidence.md
2. Investigate safely
   - Read the triage notes and rule out delays in roles, communications, mitigation criteria, and timeline capture.
   - Assign incident roles and severity.
   - Write current impact, mitigation, and next update time.
   - Record timeline entries for facts, decisions, and owners.
3. Prove the finding
   - The triage notes rule out waiting for root cause, delaying communications, rollback without criteria, and late timeline writing.
   - The incident is SEV-2 with checkout 5xx impact.
   - Rollback to revision 42 is identified as an option.
   - The tabletop requires commander, operations, communications, and planning roles.
4. Reset or hand off
   - bash labs/platform-academy/run-incident-commander-tabletop/cleanup.sh
   - Use triage-notes.md plus the signal, role, and timeline files as the complete tabletop packet.
   - Fill the timeline without live incident tooling.

## Evidence artifact map

- `labs/platform-academy/run-incident-commander-tabletop/triage-notes.md` - Decision note
- `labs/platform-academy/simulator.py` - Lab artifact
- `labs/platform-academy/run-incident-commander-tabletop/signals.md` - Decision note
- `labs/platform-academy/run-incident-commander-tabletop/roles.md` - Decision note
- `labs/platform-academy/run-incident-commander-tabletop/timeline.md` - Decision note
- `labs/platform-academy/run-incident-commander-tabletop/commander-brief.md` - Decision note
- `labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md` - Target artifact
- `labs/platform-academy/run-incident-commander-tabletop/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py` - Lab artifact
- `labs/platform-academy/run-incident-commander-tabletop/setup.sh` - Lab artifact
- `labs/platform-academy/run-incident-commander-tabletop/validate.sh` - Self-check script
- `labs/platform-academy/run-incident-commander-tabletop/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/run-incident-commander-tabletop/triage-notes.md
- labs/platform-academy/simulator.py
- labs/platform-academy/run-incident-commander-tabletop/signals.md
- labs/platform-academy/run-incident-commander-tabletop/roles.md
- labs/platform-academy/run-incident-commander-tabletop/timeline.md
- labs/platform-academy/run-incident-commander-tabletop/commander-brief.md
- labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md
- labs/platform-academy/run-incident-commander-tabletop/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py
- labs/platform-academy/run-incident-commander-tabletop/setup.sh
- labs/platform-academy/run-incident-commander-tabletop/validate.sh
- labs/platform-academy/run-incident-commander-tabletop/cleanup.sh

## Worksheet prompts

- [ ] Record the signal packet, facilitator, next update clock, and confirmation that no live mitigation was executed.
- [ ] Read triage-notes.md and list the False Leads ruled out before coordinating mitigation.
- [ ] Paste SEV-2, checkout 5xx rate change, user impact, affected capability, and decision pressure.
- [ ] Assign Incident commander, Operations lead, Communications lead, Planning lead, and escalation owner.
- [ ] Write the suspect rollout, rollback option, current mitigation status, decision criterion, and stakeholder update time.
- [ ] Add timeline entries with evidence, decision, and owner for each major event.
- [ ] Capture analyzer output, commander brief, completed timeline, validation output, and follow-up evidence to save.

## Prerequisites

- [ ] No cluster required; this tabletop uses local incident signal files and a local signal simulator.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup run-incident-commander-tabletop
- bash labs/platform-academy/run-incident-commander-tabletop/setup.sh --evidence /tmp/incident-commander-evidence.md
- sed -n '1,220p' labs/platform-academy/run-incident-commander-tabletop/triage-notes.md
- sed -n '1,180p' labs/platform-academy/run-incident-commander-tabletop/signals.md
- sed -n '1,160p' labs/platform-academy/run-incident-commander-tabletop/roles.md

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup run-incident-commander-tabletop --run-analyzer`.
- After reviewing the static evidence, run simulator output: `bash labs/platform-academy/run-lab.sh setup run-incident-commander-tabletop --run-simulator`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace run-incident-commander-tabletop --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip run-incident-commander-tabletop-learner-workspace.zip
- cd run-incident-commander-tabletop
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read the triage notes and rule out delays in roles, communications, mitigation criteria, and timeline capture.
- [ ] Assign incident roles and severity.
- [ ] Write current impact, mitigation, and next update time.
- [ ] Record timeline entries for facts, decisions, and owners.
- [ ] Run the local incident tabletop analyzer to prove severity, roles, mitigation criteria, communications clock, and handoff evidence.

## Runbook commands

- grep -n "False Leads\|root cause\|Silence\|Timeline" labs/platform-academy/run-incident-commander-tabletop/triage-notes.md
- grep -n "SEV-2\|rollback\|next stakeholder update" labs/platform-academy/run-incident-commander-tabletop/signals.md
- grep -n "Incident commander\|Operations lead\|Communications lead\|Planning lead" labs/platform-academy/run-incident-commander-tabletop/roles.md

## Expected evidence

- [ ] The triage notes rule out waiting for root cause, delaying communications, rollback without criteria, and late timeline writing.
- [ ] The incident is SEV-2 with checkout 5xx impact.
- [ ] Rollback to revision 42 is identified as an option.
- [ ] The tabletop requires commander, operations, communications, and planning roles.
- [ ] The commander brief sets mitigation criteria and a 15-minute stakeholder update.
- [ ] The local analyzer reports Incident commander tabletop analysis passed.

## Validation commands

- bash labs/platform-academy/run-incident-commander-tabletop/validate.sh
- bash labs/platform-academy/run-incident-commander-tabletop/validate.sh --evidence /tmp/incident-commander-evidence.md
- python3 labs/platform-academy/run-incident-commander-tabletop/incident_tabletop_analyzer.py --signals labs/platform-academy/run-incident-commander-tabletop/signals.md --roles labs/platform-academy/run-incident-commander-tabletop/roles.md --timeline labs/platform-academy/run-incident-commander-tabletop/timeline.md --brief labs/platform-academy/run-incident-commander-tabletop/commander-brief.md --completed-timeline labs/platform-academy/run-incident-commander-tabletop/completed-timeline.md
- grep -n "Rollback revision 43" labs/platform-academy/run-incident-commander-tabletop/commander-brief.md

## Validation checks

- [ ] No-live-mitigation safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] Severity and user impact evidence captured
- [ ] Incident roles assigned
- [ ] Rollback criteria and update clock written
- [ ] Timeline entries with evidence and owners recorded
- [ ] Communications lead handoff documented
- [ ] Incident tabletop analyzer output, validation output, and saved evidence recorded

## Rubric

- [ ] Preserves the tabletop/no-live-mitigation safety boundary and names the update clock.
- [ ] Uses triage notes to rule out waiting for root cause, delaying communications, rollback-without-criteria, and late-timeline False Leads.
- [ ] Captures SEV-2, 0.2% to 9.4% 5xx increase, payment-confirmation impact, and decision pressure.
- [ ] Assigns Incident commander, Operations lead, Communications lead, Planning lead, and escalation roles before mitigation.
- [ ] Defines revision 43 rollback criteria, revision 42 option, mitigation status, and stakeholder update timing.
- [ ] Records timeline entries with evidence, decisions, owners, and communications handoff.
- [ ] Saves commander brief, completed timeline, validation output, and cleanup/no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/run-incident-commander-tabletop/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md plus the signal, role, and timeline files as the complete tabletop packet.
- [ ] Fill the timeline without live incident tooling.
