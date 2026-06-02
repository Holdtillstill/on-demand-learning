# Solution: Build a Platform Career Artifact Pack

## Decision

Use real lab evidence as the portfolio core. Do not make broad claims without commands, artifacts, validation, and rollback notes.

## Findings

- The triage notes rule out using lab count as a claim, writing duty-only resume bullets, telling STAR stories without decisions or validation, and publishing unredacted evidence.
- Target roles repeatedly ask for Kubernetes, Terraform, AWS, CI/CD, incident response, observability, EKS, Helm, ArgoCD, SLOs, IAM, security, multi-tenancy, network policy, cost controls, Docker, supply chain, release engineering, and SRE.
- The evidence inventory has enough candidate artifacts, but it correctly calls out missing screenshots, before/after snippets, rollback notes, architecture diagram, and measurable outcome.
- The README template forces a stronger story than a generic project summary because it includes problem, environment, commands, decision, validation, rollback, and technical talking points.

## Target Pack

- `completed-proof-readme.md`: one complete portfolio artifact section.
- `resume-bullets.md`: resume bullets tied to actual platform work.
- `star-stories.md`: short STAR stories for incident response, security, cost, and release safety.

## Evidence to Save

Save the artifact README, resume bullets, STAR stories, evidence inventory, local analyzer output, public-safe redaction note, missing-evidence list, and links to the lab validators that back each claim in `evidence-template.md`.

The local career artifact analyzer reports `Career artifact pack analysis passed`.

## Cleanup

No cleanup is required for the default file-review path.
