# Review Kubernetes YAML before apply

Track: Cloud Native
Level: Fresher / Beginner
Lab tier: full
Estimated time: 30 minutes

## Scenario

A vendor manifest needs review before it reaches any cluster.

## Guided run sequence

1. Prepare workspace
   - kubectl installed locally for client-side dry-run, or the ability to inspect YAML with grep.
   - Run commands from the repository root so lab file paths resolve.
   - Do not apply the vendor manifest to a shared or production cluster.
   - bash labs/platform-academy/run-lab.sh setup review-yaml-before-apply
2. Investigate safely
   - List every resource kind and whether it is namespace-scoped or cluster-scoped.
   - Find the risky settings before reading the safe baseline.
   - Use the local analyzer to prove inventory, RBAC, workload, credential, and safer-baseline evidence.
   - Compare vendor.yaml with safe-baseline.yaml and write the review questions you would send back.
3. Prove the finding
   - The vendor manifest contains a ClusterRole that can list/watch secrets.
   - The Deployment asks for privileged mode and a hostPath mount.
   - The Secret contains placeholder stringData that should not be committed with real credentials.
   - The local analyzer reports YAML manifest risk analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/review-yaml-before-apply/cleanup.sh
   - Run the grep commands and manually review the YAML without kubectl.
   - Create a review note with resource kinds, namespaces, risky fields, and questions for the vendor.

## Evidence artifact map

- `labs/platform-academy/review-yaml-before-apply/vendor.yaml` - Manifest
- `labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml` - Target artifact
- `labs/platform-academy/review-yaml-before-apply/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `scripts/yaml_contract.py` - Lab artifact
- `labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py` - Lab artifact
- `labs/platform-academy/review-yaml-before-apply/setup.sh` - Lab artifact
- `labs/platform-academy/review-yaml-before-apply/validate.sh` - Self-check script
- `labs/platform-academy/review-yaml-before-apply/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/review-yaml-before-apply/vendor.yaml
- labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml
- labs/platform-academy/review-yaml-before-apply/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- scripts/yaml_contract.py
- labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py
- labs/platform-academy/review-yaml-before-apply/setup.sh
- labs/platform-academy/review-yaml-before-apply/validate.sh
- labs/platform-academy/review-yaml-before-apply/cleanup.sh

## Worksheet prompts

- [ ] Record the reviewed vendor.yaml file, reviewer, namespace scope, and confirmation that no live apply was run.
- [ ] Inventory resource kinds, namespaces, cluster-scoped resources, and optional dry-run or parse-check output.
- [ ] Paste ClusterRole secret access, privileged container, hostPath `/`, and Secret `stringData.token` evidence.
- [ ] Classify each blocker as RBAC, workload security, node filesystem exposure, or credential handling.
- [ ] Write the block decision, safer baseline changes, and precise questions back to the vendor.
- [ ] Capture the safe-baseline diff, validation output, cleanup, and no-live-apply evidence note.

## Prerequisites

- [ ] kubectl installed locally for client-side dry-run, or the ability to inspect YAML with grep.
- [ ] Run commands from the repository root so lab file paths resolve.
- [ ] Do not apply the vendor manifest to a shared or production cluster.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup review-yaml-before-apply
- bash labs/platform-academy/review-yaml-before-apply/setup.sh --evidence /tmp/yaml-review-evidence.md
- sed -n '1,220p' labs/platform-academy/review-yaml-before-apply/vendor.yaml

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace review-yaml-before-apply --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip review-yaml-before-apply-learner-workspace.zip
- cd review-yaml-before-apply
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] List every resource kind and whether it is namespace-scoped or cluster-scoped.
- [ ] Find the risky settings before reading the safe baseline.
- [ ] Use the local analyzer to prove inventory, RBAC, workload, credential, and safer-baseline evidence.
- [ ] Compare vendor.yaml with safe-baseline.yaml and write the review questions you would send back.
- [ ] Decide whether this manifest is blocked, approved with changes, or safe for a sandbox only.

## Runbook commands

- kubectl apply --dry-run=client --validate=false -f labs/platform-academy/review-yaml-before-apply/vendor.yaml
- grep -n "kind:\|namespace:\|ClusterRole\|privileged\|hostPath" labs/platform-academy/review-yaml-before-apply/vendor.yaml
- python3 labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py --vendor labs/platform-academy/review-yaml-before-apply/vendor.yaml --safe labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml
- kubectl explain deployment.spec.template.spec.containers

## Expected evidence

- [ ] The vendor manifest contains a ClusterRole that can list/watch secrets.
- [ ] The Deployment asks for privileged mode and a hostPath mount.
- [ ] The Secret contains placeholder stringData that should not be committed with real credentials.
- [ ] The local analyzer reports YAML manifest risk analysis passed.

## Validation commands

- bash labs/platform-academy/review-yaml-before-apply/validate.sh
- bash labs/platform-academy/review-yaml-before-apply/validate.sh --evidence /tmp/yaml-review-evidence.md
- python3 labs/platform-academy/review-yaml-before-apply/manifest_risk_analyzer.py --vendor labs/platform-academy/review-yaml-before-apply/vendor.yaml --safe labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml
- grep -n "ClusterRole\|privileged\|hostPath\|stringData" labs/platform-academy/review-yaml-before-apply/vendor.yaml
- grep -n "allowPrivilegeEscalation\|readOnlyRootFilesystem" labs/platform-academy/review-yaml-before-apply/safe-baseline.yaml

## Validation checks

- [ ] No-live-apply safety boundary recorded
- [ ] Resource inventory captured
- [ ] ClusterRole secret access evidence captured
- [ ] Privileged and hostPath evidence captured
- [ ] Secret stringData credential evidence captured
- [ ] Vendor block decision and questions recorded
- [ ] Manifest risk analysis, validation output, and cleanup/no-live-apply evidence recorded

## Rubric

- [ ] Preserves the no-live-apply safety boundary and names the reviewed vendor manifest.
- [ ] Inventories resource kinds, namespaces, cluster-scoped resources, and parse-check evidence.
- [ ] Captures `ClusterRole` secret access, `privileged: true`, `hostPath: /`, and `stringData.token` evidence.
- [ ] Classifies blockers across RBAC, workload security, node filesystem exposure, and credential handling.
- [ ] Blocks the manifest with safer-baseline requirements and vendor questions.
- [ ] Saves safe-baseline diff, validation output, cleanup, and no-live-apply evidence.

## Cleanup commands

- bash labs/platform-academy/review-yaml-before-apply/cleanup.sh

## No-cluster fallback

- [ ] Run the grep commands and manually review the YAML without kubectl.
- [ ] Create a review note with resource kinds, namespaces, risky fields, and questions for the vendor.
