# Create a service golden path

Track: Platform Engineering
Level: Advanced
Lab tier: full
Estimated time: 60 minutes

## Scenario

Your platform team needs a self-service path for launching a new service with CI, Terraform, Helm, ArgoCD, dashboards, and runbooks.

## Guided run sequence

1. Prepare workspace
   - No template engine required; this lab reviews the golden path contract.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup create-platform-golden-path
   - bash labs/platform-academy/create-platform-golden-path/setup.sh --evidence /tmp/golden-path-evidence.md
2. Investigate safely
   - Define required inputs and generated outputs.
   - Check whether ownership, SLO, and runbook defaults are complete.
   - Use the local analyzer to prove the starting gap, ready contract, and fixed metadata.
   - Describe the first-run developer experience and adoption metrics.
3. Prove the finding
   - The template generates Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog files.
   - The catalog file still has missing PagerDuty and SLO annotations.
   - The first-run flow ends with production readiness review.
   - The local analyzer reports Golden path readiness analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/create-platform-golden-path/cleanup.sh
   - Use the template files as a product review packet.
   - Write missing inputs, generated artifacts, and launch-readiness blockers.

## Evidence artifact map

- `labs/platform-academy/create-platform-golden-path/service-template.md` - Decision note
- `labs/platform-academy/create-platform-golden-path/ready-service-template.md` - Target artifact
- `labs/platform-academy/create-platform-golden-path/catalog-info.yaml` - Captured evidence
- `labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml` - Target artifact
- `labs/platform-academy/create-platform-golden-path/decision-record.md` - Decision note
- `labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py` - Lab artifact
- `labs/platform-academy/create-platform-golden-path/setup.sh` - Lab artifact
- `labs/platform-academy/create-platform-golden-path/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/create-platform-golden-path/validate.sh` - Self-check script
- `labs/platform-academy/create-platform-golden-path/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/create-platform-golden-path/service-template.md
- labs/platform-academy/create-platform-golden-path/ready-service-template.md
- labs/platform-academy/create-platform-golden-path/catalog-info.yaml
- labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml
- labs/platform-academy/create-platform-golden-path/decision-record.md
- labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py
- labs/platform-academy/create-platform-golden-path/setup.sh
- labs/platform-academy/create-platform-golden-path/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/create-platform-golden-path/validate.sh
- labs/platform-academy/create-platform-golden-path/cleanup.sh

## Worksheet prompts

- [ ] Record the service-template, catalog metadata, reviewer, and confirmation that no template engine or cluster is required.
- [ ] Paste required inputs, generated artifacts, secure runtime defaults, first-run flow, and production readiness gates.
- [ ] Paste missing `pagerduty.com/service-id`, missing SLO dashboard, runbook, cost center, and concrete owner evidence.
- [ ] Explain why incomplete ownership metadata blocks production onboarding.
- [ ] Write the ready template decision with adoption metrics, reliability metrics, and launch-validation owners.
- [ ] Capture fixed catalog diff, decision record, validation output, cleanup, and no-runtime evidence.

## Prerequisites

- [ ] No template engine required; this lab reviews the golden path contract.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup create-platform-golden-path
- bash labs/platform-academy/create-platform-golden-path/setup.sh --evidence /tmp/golden-path-evidence.md
- sed -n '1,220p' labs/platform-academy/create-platform-golden-path/service-template.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace create-platform-golden-path --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip create-platform-golden-path-learner-workspace.zip
- cd create-platform-golden-path
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Define required inputs and generated outputs.
- [ ] Check whether ownership, SLO, and runbook defaults are complete.
- [ ] Use the local analyzer to prove the starting gap, ready contract, and fixed metadata.
- [ ] Describe the first-run developer experience and adoption metrics.

## Runbook commands

- grep -n "Generated artifacts\|SLO dashboard\|Runbook\|Backstage" labs/platform-academy/create-platform-golden-path/service-template.md
- grep -n "missing\|owner\|lifecycle" labs/platform-academy/create-platform-golden-path/catalog-info.yaml
- python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py --start-template labs/platform-academy/create-platform-golden-path/service-template.md --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml --decision labs/platform-academy/create-platform-golden-path/decision-record.md
- diff -u labs/platform-academy/create-platform-golden-path/catalog-info.yaml labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml || true

## Expected evidence

- [ ] The template generates Dockerfile, Helm, CI, ArgoCD, dashboard, runbook, and catalog files.
- [ ] The catalog file still has missing PagerDuty and SLO annotations.
- [ ] The first-run flow ends with production readiness review.
- [ ] The local analyzer reports Golden path readiness analysis passed.
- [ ] The ready template defines inputs, secure defaults, launch gates, and adoption metrics.

## Validation commands

- bash labs/platform-academy/create-platform-golden-path/validate.sh
- bash labs/platform-academy/create-platform-golden-path/validate.sh --evidence /tmp/golden-path-evidence.md
- python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py --start-template labs/platform-academy/create-platform-golden-path/service-template.md --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml --decision labs/platform-academy/create-platform-golden-path/decision-record.md
- grep -n "Adoption Metrics" labs/platform-academy/create-platform-golden-path/ready-service-template.md

## Validation checks

- [ ] No-runtime template review boundary recorded
- [ ] Golden path readiness analysis passed output captured
- [ ] Required inputs and generated artifacts captured
- [ ] Secure defaults and launch gates captured
- [ ] Missing pager and SLO dashboard evidence captured
- [ ] Ownership, runbook, and cost metadata captured
- [ ] Adoption/reliability metrics and decision recorded
- [ ] Validation output and cleanup/no-runtime evidence recorded

## Rubric

- [ ] Preserves the file-review safety boundary and names the template and catalog artifacts.
- [ ] Captures required inputs, generated artifacts, secure defaults, first-run flow, and readiness gates.
- [ ] Identifies missing pager, missing SLO dashboard, runbook, cost center, and concrete owner metadata.
- [ ] Blocks production onboarding until ownership and observability metadata are complete.
- [ ] Defines adoption metrics, reliability metrics, launch gates, and owner validation.
- [ ] Saves fixed catalog diff, decision record, validation output, cleanup, and no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/create-platform-golden-path/cleanup.sh

## No-cluster fallback

- [ ] Use the template files as a product review packet.
- [ ] Write missing inputs, generated artifacts, and launch-readiness blockers.
