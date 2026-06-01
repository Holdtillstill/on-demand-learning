# Trace an ArgoCD drift report

Track: ArgoCD
Level: Intermediate
Lab tier: full
Estimated time: 35 minutes

## Scenario

ArgoCD reports OutOfSync because a controller modified a live field.

## Guided run sequence

1. Prepare workspace
   - No ArgoCD server required; this lab compares captured desired and live manifests.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup trace-argocd-drift
   - bash labs/platform-academy/trace-argocd-drift/setup.sh --evidence /tmp/argocd-drift-evidence.md
2. Investigate safely
   - Identify the exact field causing drift.
   - Use the ArgoCD app report to decide whether self-heal would fight a controller-owned field.
   - Decide whether Git or an autoscaler should own replicas.
   - Scope any ignore rule narrowly and keep other fields Git-owned.
3. Prove the finding
   - The ArgoCD app report marks checkout OutOfSync and selfHeal enabled.
   - Git wants three replicas while live state has nine.
   - The live object carries autoscaling metadata.
   - The ownership decision should mention a narrow replicas-only ignore rule.
4. Reset or hand off
   - bash labs/platform-academy/trace-argocd-drift/cleanup.sh
   - Treat argocd-app-report.txt, desired.yaml, and live.yaml as exported ArgoCD evidence.
   - Write the field owner decision without connecting to ArgoCD.

## Evidence artifact map

- `labs/platform-academy/trace-argocd-drift/argocd-app-report.txt` - Starting evidence
- `labs/platform-academy/trace-argocd-drift/desired.yaml` - Manifest
- `labs/platform-academy/trace-argocd-drift/live.yaml` - Starting evidence
- `labs/platform-academy/trace-argocd-drift/ignore-differences.yaml` - Manifest
- `labs/platform-academy/trace-argocd-drift/ownership-decision.md` - Decision note
- `labs/platform-academy/trace-argocd-drift/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/trace-argocd-drift/drift_analyzer.py` - Lab artifact
- `labs/platform-academy/trace-argocd-drift/setup.sh` - Lab artifact
- `labs/platform-academy/trace-argocd-drift/validate.sh` - Self-check script
- `labs/platform-academy/trace-argocd-drift/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
- labs/platform-academy/trace-argocd-drift/desired.yaml
- labs/platform-academy/trace-argocd-drift/live.yaml
- labs/platform-academy/trace-argocd-drift/ignore-differences.yaml
- labs/platform-academy/trace-argocd-drift/ownership-decision.md
- labs/platform-academy/trace-argocd-drift/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/trace-argocd-drift/drift_analyzer.py
- labs/platform-academy/trace-argocd-drift/setup.sh
- labs/platform-academy/trace-argocd-drift/validate.sh
- labs/platform-academy/trace-argocd-drift/cleanup.sh

## Worksheet prompts

- [ ] Record the ArgoCD report, desired/live manifest sources, reviewer, and confirmation that no force-sync or broad ignore rule was applied.
- [ ] Paste the desired and live replica values plus the exact drift field path.
- [ ] Paste the sync policy and explain the `selfHeal` risk if ArgoCD fights controller-owned replicas.
- [ ] Paste the autoscaling/controller ownership signal from the live object.
- [ ] Decide whether Git or autoscaling owns replicas and list fields that must remain Git-owned.
- [ ] Review the proposed ignore rule and explain why it stays narrowly scoped.
- [ ] Capture validation output, owner decision, and evidence artifacts you would save.

## Prerequisites

- [ ] No ArgoCD server required; this lab compares captured desired and live manifests.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup trace-argocd-drift
- bash labs/platform-academy/trace-argocd-drift/setup.sh --evidence /tmp/argocd-drift-evidence.md
- sed -n '1,220p' labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
- sed -n '1,160p' labs/platform-academy/trace-argocd-drift/ownership-decision.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace trace-argocd-drift --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip trace-argocd-drift-learner-workspace.zip
- cd trace-argocd-drift
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Identify the exact field causing drift.
- [ ] Use the ArgoCD app report to decide whether self-heal would fight a controller-owned field.
- [ ] Decide whether Git or an autoscaler should own replicas.
- [ ] Scope any ignore rule narrowly and keep other fields Git-owned.
- [ ] Run the local analyzer to verify image/resources remain Git-owned while replicas are the only ignored field.

## Runbook commands

- diff -u labs/platform-academy/trace-argocd-drift/desired.yaml labs/platform-academy/trace-argocd-drift/live.yaml || true
- grep -n "OutOfSync\|selfHeal\|/spec/replicas" labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
- grep -n "replicas\|last-scale\|ignoreDifferences" labs/platform-academy/trace-argocd-drift/*.yaml labs/platform-academy/trace-argocd-drift/ownership-decision.md
- python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py --desired labs/platform-academy/trace-argocd-drift/desired.yaml --live labs/platform-academy/trace-argocd-drift/live.yaml --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt

## Expected evidence

- [ ] The ArgoCD app report marks checkout OutOfSync and selfHeal enabled.
- [ ] Git wants three replicas while live state has nine.
- [ ] The live object carries autoscaling metadata.
- [ ] The ownership decision should mention a narrow replicas-only ignore rule.
- [ ] The analyzer confirms the ignore rule is scoped to checkout in payments and only /spec/replicas.

## Validation commands

- bash labs/platform-academy/trace-argocd-drift/validate.sh
- bash labs/platform-academy/trace-argocd-drift/validate.sh --evidence /tmp/argocd-drift-evidence.md
- python3 labs/platform-academy/trace-argocd-drift/drift_analyzer.py --desired labs/platform-academy/trace-argocd-drift/desired.yaml --live labs/platform-academy/trace-argocd-drift/live.yaml --ignore-rule labs/platform-academy/trace-argocd-drift/ignore-differences.yaml --report labs/platform-academy/trace-argocd-drift/argocd-app-report.txt
- grep -n "replicas: 9" labs/platform-academy/trace-argocd-drift/live.yaml
- grep -n "spec.replicas" labs/platform-academy/trace-argocd-drift/ownership-decision.md

## Validation checks

- [ ] ArgoCD report and no-force-sync safety boundary recorded
- [ ] Desired/live replica evidence captured
- [ ] selfHeal risk captured
- [ ] Autoscaling ownership evidence captured
- [ ] Git-owned fields listed
- [ ] Narrow ignore rule reviewed
- [ ] Ownership decision written
- [ ] Validation output and saved evidence recorded

## Rubric

- [ ] Uses the ArgoCD app report to preserve the captured-manifest safety boundary and avoid force-sync or broad ignore rules.
- [ ] Captures desired `replicas: 3`, live `replicas: 9`, and `.spec.replicas` drift evidence.
- [ ] Explains why `selfHeal: true` can fight autoscaling when field ownership is unclear.
- [ ] Uses autoscaling metadata as controller-ownership evidence instead of assuming human drift.
- [ ] Separates autoscaler-owned replicas from Git-owned image, labels, resources, and security fields.
- [ ] Chooses a narrow `/spec/replicas` ignore rule scoped to the checkout Deployment only.
- [ ] Saves ownership decision, ignore-rule review, validation output, and cleanup/no-runtime notes.

## Cleanup commands

- bash labs/platform-academy/trace-argocd-drift/cleanup.sh

## No-cluster fallback

- [ ] Treat argocd-app-report.txt, desired.yaml, and live.yaml as exported ArgoCD evidence.
- [ ] Write the field owner decision without connecting to ArgoCD.
