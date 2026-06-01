# Incident Commander Brief

## Severity

SEV-2. Checkout payment confirmation intermittently fails after canary promotion.

## Current Impact

Users can browse the catalog, but checkout confirmation has elevated 5xx errors.

## Roles

- Incident commander: owns pace, severity, decision log, and handoff.
- Operations lead: runs diagnostics and approved mitigation.
- Communications lead: sends internal and customer-facing updates.
- Planning lead: maintains timeline and follow-up owners.

## Mitigation Decision

Rollback revision 43 if error rate does not drop within five minutes or if readiness/target-health symptoms continue. Continue log review in parallel, but do not delay user-impact mitigation indefinitely.

## Next Update

Send stakeholder update within 15 minutes with impact, mitigation status, next decision time, and owner.
