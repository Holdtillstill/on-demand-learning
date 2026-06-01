# Solution: Run an Incident Commander Tabletop

## Decision

Confirm SEV-2, assign incident roles, and prepare rollback unless impact drops within the decision window.

## Findings

- Checkout 5xx rose from 0.2% to 9.4%.
- Payment confirmation intermittently fails.
- Revision 43 was promoted to 100%.
- Rollback to revision 42 is available.
- Stakeholder update is due in 15 minutes.

## Evidence to Save

Save role assignments, current impact, mitigation decision, next update time, local analyzer output, and a timeline entry for each decision.

The local incident tabletop analyzer reports `Incident commander tabletop analysis passed`.

## Handoff Note

A good handoff says: confirm SEV-2 because checkout 5xx rose from 0.2% to 9.4% and payment confirmation intermittently fails after revision 43 reached 100%. Assign commander, operations, communications, and planning leads, prepare rollback to revision 42 if impact does not drop within five minutes, and send the stakeholder update within 15 minutes.

## Cleanup

No cleanup is required for the tabletop path.
