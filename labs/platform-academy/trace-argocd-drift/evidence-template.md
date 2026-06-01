# Evidence Template: Trace An ArgoCD Drift Report

## Scope And Safety

- ArgoCD report reviewed:
- Captured desired manifest:
- Captured live manifest:
- Confirmation that no force-sync or broad ignore rule was applied:
- Reviewer:

## Drift Field Evidence

- Desired field/value:
- Live field/value:
- Exact JSON pointer or field path:
- Sync policy/selfHeal risk:
- Controller ownership signal:

## Ownership Decision

- Should Git own this field:
- Should an autoscaler own this field:
- Fields that must remain Git-owned:
- Why a full-object ignore is unsafe:

## Ignore Rule Review

- Application/resource scoped:
- Namespace/name scoped:
- JSON pointer:
- Fields intentionally not ignored:
- Local drift analyzer result:

## Validation And Handoff

- Decision:
- Validation command:
- Evidence to save:
- Owner:
