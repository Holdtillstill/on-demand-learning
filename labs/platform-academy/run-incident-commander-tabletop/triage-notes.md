# Triage Notes: Incident Commander Tabletop

## Evidence Source

These notes are a captured incident-command packet for the tabletop lab. Use them with `signals.md`, `roles.md`, `timeline.md`, `commander-brief.md`, and `completed-timeline.md` when no live incident tooling is available.

## Timeline

- 20:02 UTC: Checkout 5xx rose from 0.2% to 9.4%.
- 20:04 UTC: Payment confirmation failures made the incident user-visible.
- 20:06 UTC: SEV-2 was declared and the next stakeholder update clock was set to 15 minutes.
- 20:08 UTC: Revision 43 was confirmed as the current rollout, with revision 42 available as rollback.
- 20:10 UTC: Roles were assigned before mitigation so decisions, operations, communications, and planning had clear owners.
- 20:12 UTC: Rollback criteria were set instead of waiting for perfect root-cause proof.

## False Leads Ruled Out

- Waiting for root cause before assigning roles slows the incident response.
- Silence until the fix is confirmed misses the stakeholder update clock.
- Immediate rollback without a decision criterion can hide whether the mitigation worked.
- Waiting for perfect telemetry can prolong user impact.
- Timeline entries written after the incident lose decision evidence and owners.

## Strongest Clues

- SEV-2 is justified by checkout 5xx rising from 0.2% to 9.4%.
- Payment confirmation intermittently fails after revision 43 reached 100%.
- Revision 42 is the known rollback option.
- Incident commander, operations, communications, and planning leads are all assigned.
- The completed timeline records time, evidence, decision, and owner for each major action.

## Evidence To Save

- Severity, impact statement, error-rate change, affected capability, and decision pressure.
- Role assignments, escalation owner, rollback option, current mitigation status, and stakeholder update clock.
- Timeline entries with evidence, decisions, owners, communications handoff, analyzer output, validation, and no-live tabletop note.
