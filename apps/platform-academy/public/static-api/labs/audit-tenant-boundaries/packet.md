# Audit Kubernetes tenant boundaries

Track: Security
Level: Advanced
Lab tier: full
Estimated time: 50 minutes

## Scenario

A shared cluster needs a tenant access review before onboarding another team.

## Guided run sequence

1. Prepare workspace
   - kubectl is optional; the default path is local manifest review.
   - Do not apply this manifest to a shared cluster because it intentionally contains risky RBAC.
   - Optional cluster mode requires a disposable local Kubernetes context.
   - bash labs/platform-academy/run-lab.sh setup audit-tenant-boundaries
2. Investigate safely
   - Read the triage notes and rule out shortcuts that would approve the tenant too quickly.
   - Find broad RBAC and secret access.
   - Check whether NetworkPolicy creates a real boundary.
   - Use the local analyzer to prove the RBAC, Pod Security, NetworkPolicy, and safer-target evidence.
3. Prove the finding
   - The triage notes rule out temporary admin, secret debugging, policy-object presence, and dry-run approval shortcuts.
   - A temporary ClusterRoleBinding grants cluster-admin.
   - The Role can list and watch secrets.
   - The NetworkPolicy allows all egress.
4. Reset or hand off
   - bash labs/platform-academy/audit-tenant-boundaries/cleanup.sh
   - Review triage-notes.md and tenant-a.yaml directly and write the onboarding blockers.
   - Use review.md as the expected finding checklist.

## Evidence artifact map

- `labs/platform-academy/audit-tenant-boundaries/triage-notes.md` - Decision note
- `labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml` - Manifest
- `labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml` - Target artifact
- `labs/platform-academy/audit-tenant-boundaries/review.md` - Decision note
- `labs/platform-academy/audit-tenant-boundaries/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/cluster-safety.sh` - Target artifact
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py` - Lab artifact
- `labs/platform-academy/audit-tenant-boundaries/setup.sh` - Lab artifact
- `labs/platform-academy/audit-tenant-boundaries/validate.sh` - Self-check script
- `labs/platform-academy/audit-tenant-boundaries/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/audit-tenant-boundaries/triage-notes.md
- labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
- labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml
- labs/platform-academy/audit-tenant-boundaries/review.md
- labs/platform-academy/audit-tenant-boundaries/evidence-template.md
- labs/platform-academy/lib/cluster-safety.sh
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py
- labs/platform-academy/audit-tenant-boundaries/setup.sh
- labs/platform-academy/audit-tenant-boundaries/validate.sh
- labs/platform-academy/audit-tenant-boundaries/cleanup.sh

## Worksheet prompts

- [ ] Record the manifest reviewed, tenant namespace, safety boundary, and cleanup command if a disposable cluster was used.
- [ ] Read triage-notes.md and list the False Leads ruled out before approving tenant onboarding.
- [ ] Paste the ClusterRoleBinding, bound subject, cluster-admin role, and secret access evidence.
- [ ] Paste the Pod Security enforcement level and the required restricted target.
- [ ] Paste the NetworkPolicy egress rule and explain why it is not a default-deny boundary.
- [ ] Write the onboarding decision with blocking findings, required changes, owner, and expiry for exceptions.
- [ ] Capture validation output, safer target evidence, cleanup, and no-runtime-review evidence.

## Prerequisites

- [ ] kubectl is optional; the default path is local manifest review.
- [ ] Do not apply this manifest to a shared cluster because it intentionally contains risky RBAC.
- [ ] Optional cluster mode requires a disposable local Kubernetes context.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup audit-tenant-boundaries
- bash labs/platform-academy/audit-tenant-boundaries/setup.sh --evidence /tmp/tenant-boundaries-evidence.md
- sed -n '1,220p' labs/platform-academy/audit-tenant-boundaries/triage-notes.md
- kubectl create --dry-run=client --validate=false -f labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
- sed -n '1,180p' labs/platform-academy/audit-tenant-boundaries/review.md
- bash labs/platform-academy/bootstrap-local-cluster.sh --preflight audit-tenant-boundaries
- bash labs/platform-academy/audit-tenant-boundaries/setup.sh --preflight
- bash labs/platform-academy/audit-tenant-boundaries/setup.sh --cluster --evidence /tmp/tenant-boundaries-evidence.md

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup audit-tenant-boundaries --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace audit-tenant-boundaries --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip audit-tenant-boundaries-learner-workspace.zip
- cd audit-tenant-boundaries
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Optional cluster workflow

- From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight audit-tenant-boundaries
- From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight
- Create the broken lab state: ./setup.sh --cluster
- After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster
- Clean up the lab namespace/resources: ./cleanup.sh
- No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace.

## Practice steps

- [ ] Read the triage notes and rule out shortcuts that would approve the tenant too quickly.
- [ ] Find broad RBAC and secret access.
- [ ] Check whether NetworkPolicy creates a real boundary.
- [ ] Use the local analyzer to prove the RBAC, Pod Security, NetworkPolicy, and safer-target evidence.
- [ ] Record exception owners and expiry requirements before onboarding.

## Runbook commands

- grep -n "False Leads\|temporary cluster-admin\|dry-run" labs/platform-academy/audit-tenant-boundaries/triage-notes.md
- grep -n "cluster-admin\|secrets\|allow-all-egress\|pod-security" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
- grep -n "Block onboarding\|secret access\|egress" labs/platform-academy/audit-tenant-boundaries/review.md

## Expected evidence

- [ ] The triage notes rule out temporary admin, secret debugging, policy-object presence, and dry-run approval shortcuts.
- [ ] A temporary ClusterRoleBinding grants cluster-admin.
- [ ] The Role can list and watch secrets.
- [ ] The NetworkPolicy allows all egress.
- [ ] The local analyzer reports Tenant boundary analysis passed.

## Validation commands

- bash labs/platform-academy/audit-tenant-boundaries/validate.sh
- bash labs/platform-academy/audit-tenant-boundaries/validate.sh --evidence /tmp/tenant-boundaries-evidence.md
- bash labs/platform-academy/run-lab.sh validate audit-tenant-boundaries --cluster
- bash labs/platform-academy/audit-tenant-boundaries/validate.sh --cluster
- python3 labs/platform-academy/audit-tenant-boundaries/tenant_boundary_analyzer.py --broken labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml --fixed labs/platform-academy/audit-tenant-boundaries/fixed-tenant-a.yaml --review labs/platform-academy/audit-tenant-boundaries/review.md
- grep -n "name: cluster-admin" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml
- grep -n "resources: \[\"secrets\"\]" labs/platform-academy/audit-tenant-boundaries/tenant-a.yaml

## Validation checks

- [ ] No-shared-cluster safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] ClusterRoleBinding and cluster-admin evidence captured
- [ ] Secret access evidence captured
- [ ] Pod Security baseline/restricted evidence captured
- [ ] Allow-all egress evidence captured
- [ ] Onboarding decision with owner/expiry recorded
- [ ] Validation output and cleanup/no-runtime evidence recorded

## Rubric

- [ ] Preserves the no-shared-cluster safety boundary and names the tenant namespace.
- [ ] Uses triage notes to rule out temporary admin, secret debugging, policy-object presence, baseline-default, and dry-run approval False Leads.
- [ ] Captures cluster-admin and secret-read RBAC evidence with exact resources and subjects.
- [ ] Identifies Pod Security `baseline` as weaker than the required `restricted` target.
- [ ] Explains why `allow-all-egress` is not tenant isolation and names the default-deny target.
- [ ] Blocks onboarding with owners, expiry dates, and required boundary changes.
- [ ] Saves validation, safer manifest diff, cleanup, and no-runtime-review evidence.

## Cleanup commands

- bash labs/platform-academy/audit-tenant-boundaries/cleanup.sh

## No-cluster fallback

- [ ] Review triage-notes.md and tenant-a.yaml directly and write the onboarding blockers.
- [ ] Use review.md as the expected finding checklist.
