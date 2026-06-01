# Evidence Template: Debug An AWS ALB Health Path

## Scope And Safety

- AWS account or evidence source:
- Kubernetes namespace:
- Ingress/service manifest:
- Reason no live mutation is required:

## ALB Target Health Evidence

- Target group:
- Unhealthy target:
- Target health reason:
- HTTP status observed:
- Health check path expected by ALB:

## Kubernetes Routing Evidence

- Ingress backend service and port:
- Service `targetPort`:
- Pod port name and number:
- Controller event:

## Application Contract Check

- Current app health endpoint:
- Is `/healthz` implemented:
- Should the fix change the app path, Ingress annotation, or both:

## Owner Decision

- AWS networking owner action:
- Ingress/controller owner action:
- App owner action:
- Source manifest change:
- Console-only change rejected because:

## Validation And Handoff

- Validation command:
- Evidence saved:
- Next deploy or rollback check:
