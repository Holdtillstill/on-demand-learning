# Write an SLO-backed Kubernetes runbook

Track: SRE
Level: Advanced
Lab tier: full
Estimated time: 50 minutes

## Scenario

Checkout latency is burning the monthly SLO and on-call needs a fast, low-noise response path.

## Guided run sequence

1. Prepare workspace
   - No Prometheus server required; this lab uses local alert and incident files.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup write-slo-backed-runbook
   - bash labs/platform-academy/write-slo-backed-runbook/setup.sh --evidence /tmp/slo-runbook-evidence.md
2. Investigate safely
   - Read the triage notes and rule out rollback-first and correlation-only responses.
   - Name the user-visible SLO and burn signal.
   - Tie the alert to rollout and Kubernetes event evidence.
   - Use the local analyzer to prove the alert, rollout correlation, safe commands, and mitigation boundary.
3. Prove the finding
   - The triage notes rule out rollback-first response, revision-correlation proof, threshold-only evidence, and ownerless follow-up.
   - The alert pages on a checkout 5xx ratio over 2%.
   - The signals connect rollout revision 43 with readiness flapping.
   - The runbook template separates evidence, mitigation, and follow-up.
4. Reset or hand off
   - bash labs/platform-academy/write-slo-backed-runbook/cleanup.sh
   - Use triage-notes.md and signals.md as the incident transcript.
   - Fill runbook-template.md without connecting to Prometheus or Kubernetes.

## Evidence artifact map

- `labs/platform-academy/write-slo-backed-runbook/triage-notes.md` - Decision note
- `labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml` - Manifest
- `labs/platform-academy/write-slo-backed-runbook/signals.md` - Decision note
- `labs/platform-academy/write-slo-backed-runbook/runbook-template.md` - Decision note
- `labs/platform-academy/write-slo-backed-runbook/completed-runbook.md` - Target artifact
- `labs/platform-academy/write-slo-backed-runbook/incident-decision.md` - Decision note
- `labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py` - Lab artifact
- `labs/platform-academy/write-slo-backed-runbook/setup.sh` - Lab artifact
- `labs/platform-academy/write-slo-backed-runbook/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/write-slo-backed-runbook/validate.sh` - Self-check script
- `labs/platform-academy/write-slo-backed-runbook/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/write-slo-backed-runbook/triage-notes.md
- labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml
- labs/platform-academy/write-slo-backed-runbook/signals.md
- labs/platform-academy/write-slo-backed-runbook/runbook-template.md
- labs/platform-academy/write-slo-backed-runbook/completed-runbook.md
- labs/platform-academy/write-slo-backed-runbook/incident-decision.md
- labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py
- labs/platform-academy/write-slo-backed-runbook/setup.sh
- labs/platform-academy/write-slo-backed-runbook/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/write-slo-backed-runbook/validate.sh
- labs/platform-academy/write-slo-backed-runbook/cleanup.sh

## Worksheet prompts

- [ ] Record the alert/signal packet, service, reviewer, and confirmation that no live rollback command was run.
- [ ] Read triage-notes.md and list the False Leads ruled out before mitigation.
- [ ] Paste the 99.9% SLO target, CheckoutHighErrorBudgetBurn alert, 2% threshold, 14-minute duration, dashboard, and user impact.
- [ ] Paste revision 43 rollout timing, readiness flapping, target-health symptoms, and dependency evidence still needed.
- [ ] Write safe first commands plus rollback, traffic-shift, and escalation criteria.
- [ ] Write the mitigation decision, follow-up owners, dashboard/runbook improvements, and validation signals.
- [ ] Capture validation output and the alert, rollout, event, decision, and post-mitigation evidence you would save.

## Prerequisites

- [ ] No Prometheus server required; this lab uses local alert and incident files.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup write-slo-backed-runbook
- bash labs/platform-academy/write-slo-backed-runbook/setup.sh --evidence /tmp/slo-runbook-evidence.md
- sed -n '1,220p' labs/platform-academy/write-slo-backed-runbook/triage-notes.md
- sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/signals.md
- sed -n '1,180p' labs/platform-academy/write-slo-backed-runbook/runbook-template.md

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup write-slo-backed-runbook --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace write-slo-backed-runbook --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip write-slo-backed-runbook-learner-workspace.zip
- cd write-slo-backed-runbook
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read the triage notes and rule out rollback-first and correlation-only responses.
- [ ] Name the user-visible SLO and burn signal.
- [ ] Tie the alert to rollout and Kubernetes event evidence.
- [ ] Use the local analyzer to prove the alert, rollout correlation, safe commands, and mitigation boundary.
- [ ] Fill the runbook with safe commands, mitigation choices, and follow-up owners.

## Runbook commands

- grep -n "False Leads\|Rollback is not\|Revision 43 correlation" labs/platform-academy/write-slo-backed-runbook/triage-notes.md
- grep -n "CheckoutHighErrorBudgetBurn\|0.02\|severity: page" labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml
- grep -n "revision 43\|readiness flapping\|Mitigation" labs/platform-academy/write-slo-backed-runbook/signals.md
- diff -u labs/platform-academy/write-slo-backed-runbook/runbook-template.md labs/platform-academy/write-slo-backed-runbook/completed-runbook.md || true

## Expected evidence

- [ ] The triage notes rule out rollback-first response, revision-correlation proof, threshold-only evidence, and ownerless follow-up.
- [ ] The alert pages on a checkout 5xx ratio over 2%.
- [ ] The signals connect rollout revision 43 with readiness flapping.
- [ ] The runbook template separates evidence, mitigation, and follow-up.
- [ ] The local analyzer reports SLO runbook analysis passed.
- [ ] The completed runbook ties rollback criteria to revision 43 and post-mitigation validation.

## Validation commands

- bash labs/platform-academy/write-slo-backed-runbook/validate.sh
- bash labs/platform-academy/write-slo-backed-runbook/validate.sh --evidence /tmp/slo-runbook-evidence.md
- python3 labs/platform-academy/write-slo-backed-runbook/slo_runbook_analyzer.py --signals labs/platform-academy/write-slo-backed-runbook/signals.md --rule labs/platform-academy/write-slo-backed-runbook/prometheus-rule.yaml --runbook labs/platform-academy/write-slo-backed-runbook/completed-runbook.md --decision labs/platform-academy/write-slo-backed-runbook/incident-decision.md
- grep -n "Collect read-only evidence first" labs/platform-academy/write-slo-backed-runbook/incident-decision.md

## Validation checks

- [ ] No-live-rollback safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] SLO target, burn alert, and SLO runbook analysis output captured
- [ ] Revision 43 and symptom evidence captured
- [ ] Safe first commands and mitigation criteria written
- [ ] Owner split and follow-up actions recorded
- [ ] Validation signals documented
- [ ] Saved evidence and cleanup/no-runtime note recorded

## Rubric

- [ ] Preserves the no-live-rollback safety boundary and names the SLO signal packet.
- [ ] Uses triage notes to rule out rollback-first response, correlation-only proof, threshold-only evidence, and ownerless follow-up False Leads.
- [ ] Captures 99.9% availability, CheckoutHighErrorBudgetBurn, 2% 5xx threshold, and 14-minute burn evidence.
- [ ] Connects revision 43, readiness flapping, and target-health symptoms without skipping dependency checks.
- [ ] Defines read-only first commands and rollback/traffic-shift/escalation criteria before mitigation.
- [ ] Assigns Incident commander, app, platform, SRE, and dependency owners with validation and follow-up actions.
- [ ] Saves runbook, incident decision, validation output, dashboard link, and cleanup/no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/write-slo-backed-runbook/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md and signals.md as the incident transcript.
- [ ] Fill runbook-template.md without connecting to Prometheus or Kubernetes.
