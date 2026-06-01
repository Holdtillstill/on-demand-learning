# Trace Network Path Evidence Template

## Request And Edge Evidence

- Handoff file reviewed:
- Hop trace reviewed:
- Impact and safety boundary:
- Client status and server header:
- DNS target:
- ALB target-health symptom:
- Failing hop hypothesis:

## False Leads Ruled Out

- DNS evidence:
- ALB/Ingress evidence:
- Pod readiness or port evidence:
- Why not a console-only fix:

## Ingress, Service, And Pod Evidence

- Ingress host and path:
- Backend Service and port:
- Broken Service targetPort:
- Pod port name and containerPort:
- Endpoint or readiness evidence:

## Owner And Fix Decision

- Local network path analyzer result:
- Primary owner:
- Owners ruled out and why:
- Source-manifest fix:
- Why this is not a DNS or ALB-only issue:
- Validation output to save:
- Cleanup or no-cluster note:
