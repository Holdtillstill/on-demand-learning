# STAR Stories

## Incident Response

- Situation: Checkout traffic returned intermittent 503s.
- Task: Diagnose without making risky changes first.
- Action: Compared Service selectors, Pod labels, EndpointSlice state, and cleanup path.
- Result: Identified selector mismatch and produced a reusable debugging narrative.

## Security

- Situation: A tenant onboarding manifest requested broad access.
- Task: Review blast radius before approval.
- Action: Flagged cluster-admin binding, secret reads, weak Pod Security, and allow-all egress.
- Result: Produced a safer restricted baseline and onboarding block decision.

## Cost

- Situation: Platform spend increased after Kubernetes adoption.
- Task: Separate legitimate growth from waste.
- Action: Reviewed over-requested workloads, idle load balancers, abandoned PVCs, and ownership gaps.
- Result: Created a recommendation model with owner, expected savings, reliability risk, and rollback.

## Release Safety

- Situation: A team wanted push-to-prod for a Kubernetes service.
- Task: Keep velocity while protecting users.
- Action: Added digest promotion, scan, SBOM, manifest validation, staging smoke, approval, canary, and rollback gates.
- Result: Turned a risky pipeline into a reviewable release contract.
