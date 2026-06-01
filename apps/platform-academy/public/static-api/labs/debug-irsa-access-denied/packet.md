# Debug IRSA AccessDenied for a Pod

Track: AWS IAM
Level: Intermediate
Lab tier: full
Estimated time: 45 minutes

## Scenario

A workload can start but AWS SDK calls fail with AccessDenied after a service-account change.

## Guided run sequence

1. Prepare workspace
   - No AWS credentials required; this lab uses local Kubernetes and CloudTrail evidence.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup debug-irsa-access-denied
   - bash labs/platform-academy/debug-irsa-access-denied/setup.sh --evidence /tmp/irsa-access-denied-evidence.md
2. Investigate safely
   - Read triage-notes.md and rule out Pod restart, token rotation, bucket-policy-only, wildcard, and live-IAM false leads.
   - Match the Pod service account to the annotated IAM role.
   - Compare the application-side SDK failure with the CloudTrail denial.
   - Compare the trust policy subject with the real namespace and service account.
3. Prove the finding
   - The triage notes rule out restarts, token rotation, bucket-policy-only changes, wildcard trust, and broad S3 permissions.
   - The ServiceAccount is payments/checkout.
   - The workload log shows AWS_ROLE_ARN for payments-checkout-readonly and an SDK AccessDenied on PutObject.
   - The trust policy subject allows default/checkout instead.
4. Reset or hand off
   - bash labs/platform-academy/debug-irsa-access-denied/cleanup.sh
   - Review triage-notes.md, serviceaccount.yaml, workload-error.log, trust-policy.json, and cloudtrail-event.json as exported evidence.
   - Write whether the immediate blocker is trust subject mismatch, permission scope, or both.

## Evidence artifact map

- `labs/platform-academy/debug-irsa-access-denied/triage-notes.md` - Decision note
- `labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml` - Manifest
- `labs/platform-academy/debug-irsa-access-denied/workload-error.log` - Captured evidence
- `labs/platform-academy/debug-irsa-access-denied/trust-policy.json` - Manifest
- `labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json` - Target artifact
- `labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json` - Manifest
- `labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json` - Captured evidence
- `labs/platform-academy/debug-irsa-access-denied/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py` - Lab artifact
- `labs/platform-academy/debug-irsa-access-denied/setup.sh` - Lab artifact
- `labs/platform-academy/debug-irsa-access-denied/validate.sh` - Self-check script
- `labs/platform-academy/debug-irsa-access-denied/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/debug-irsa-access-denied/triage-notes.md
- labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml
- labs/platform-academy/debug-irsa-access-denied/workload-error.log
- labs/platform-academy/debug-irsa-access-denied/trust-policy.json
- labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json
- labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json
- labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json
- labs/platform-academy/debug-irsa-access-denied/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py
- labs/platform-academy/debug-irsa-access-denied/setup.sh
- labs/platform-academy/debug-irsa-access-denied/validate.sh
- labs/platform-academy/debug-irsa-access-denied/cleanup.sh

## Worksheet prompts

- [ ] Record the evidence source, namespace, ServiceAccount, IAM role ARN, and confirmation that no live IAM changes are being made.
- [ ] Read triage-notes.md and list the False Leads ruled out before editing IAM.
- [ ] Paste the Kubernetes and runtime identity evidence: ServiceAccount namespace/name, Pod `serviceAccountName`, role annotation, and `AWS_ROLE_ARN`.
- [ ] Paste the application-side SDK error from workload-error.log and compare it with CloudTrail.
- [ ] Paste the trust policy subject, expected subject, and namespace mismatch.
- [ ] Paste the CloudTrail denied action, error code, assumed role, bucket, and key prefix.
- [ ] Decide whether the failure is trust, permission, or both, and name the owner for each fix.
- [ ] Write the narrow trust and least-privilege permission fix plus validation or rollout handoff.

## Prerequisites

- [ ] No AWS credentials required; this lab uses local Kubernetes and CloudTrail evidence.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup debug-irsa-access-denied
- bash labs/platform-academy/debug-irsa-access-denied/setup.sh --evidence /tmp/irsa-access-denied-evidence.md
- sed -n '1,220p' labs/platform-academy/debug-irsa-access-denied/triage-notes.md
- kubectl create --dry-run=client --validate=false -f labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml
- sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/workload-error.log
- sed -n '1,180p' labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After reviewing the static evidence, run simulator output: `bash labs/platform-academy/run-lab.sh setup debug-irsa-access-denied --run-simulator`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace debug-irsa-access-denied --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip debug-irsa-access-denied-learner-workspace.zip
- cd debug-irsa-access-denied
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read triage-notes.md and rule out Pod restart, token rotation, bucket-policy-only, wildcard, and live-IAM false leads.
- [ ] Match the Pod service account to the annotated IAM role.
- [ ] Compare the application-side SDK failure with the CloudTrail denial.
- [ ] Compare the trust policy subject with the real namespace and service account.
- [ ] Use the CloudTrail action and resource to decide whether the trust policy or permissions policy is wrong.
- [ ] Run the local simulator to prove the proposed trust subject and S3 object-prefix permission cover the captured request.

## Runbook commands

- grep -n "False Leads\|Wildcard trust\|s3:\*" labs/platform-academy/debug-irsa-access-denied/triage-notes.md
- grep -n "role-arn\|serviceAccountName\|AWS_ROLE_ARN" labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml labs/platform-academy/debug-irsa-access-denied/workload-error.log
- grep -n "system:serviceaccount\|AccessDenied\|PutObject" labs/platform-academy/debug-irsa-access-denied/trust-policy.json labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json

## Expected evidence

- [ ] The triage notes rule out restarts, token rotation, bucket-policy-only changes, wildcard trust, and broad S3 permissions.
- [ ] The ServiceAccount is payments/checkout.
- [ ] The workload log shows AWS_ROLE_ARN for payments-checkout-readonly and an SDK AccessDenied on PutObject.
- [ ] The trust policy subject allows default/checkout instead.
- [ ] CloudTrail denies s3:PutObject through the readonly role.
- [ ] The simulator proves the fixed trust subject and least-privilege policy allow the captured request without broad S3 scope.

## Validation commands

- bash labs/platform-academy/debug-irsa-access-denied/validate.sh
- bash labs/platform-academy/debug-irsa-access-denied/validate.sh --evidence /tmp/irsa-access-denied-evidence.md
- python3 labs/platform-academy/debug-irsa-access-denied/irsa_simulator.py --serviceaccount labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml --trust-policy labs/platform-academy/debug-irsa-access-denied/trust-policy.json --fixed-trust-policy labs/platform-academy/debug-irsa-access-denied/fixed-trust-policy.json --cloudtrail-event labs/platform-academy/debug-irsa-access-denied/cloudtrail-event.json --permission-policy labs/platform-academy/debug-irsa-access-denied/least-privilege-policy.json
- grep -n "namespace: payments" labs/platform-academy/debug-irsa-access-denied/serviceaccount.yaml
- grep -n "system:serviceaccount:default:checkout" labs/platform-academy/debug-irsa-access-denied/trust-policy.json

## Validation checks

- [ ] No-live-IAM safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] ServiceAccount and runtime role identity evidence captured
- [ ] Application SDK AccessDenied evidence captured
- [ ] Trust subject mismatch captured
- [ ] CloudTrail AccessDenied evidence captured
- [ ] Bucket and key-prefix evidence captured
- [ ] Trust and permission owners separated
- [ ] Narrow fix and validation handoff recorded

## Rubric

- [ ] Preserves the captured-evidence safety boundary and avoids live IAM mutation.
- [ ] Uses triage notes to rule out restarts, token rotation, bucket-policy-only changes, wildcard trust, and broad S3 False Leads.
- [ ] Captures Kubernetes identity and runtime `AWS_ROLE_ARN` evidence for `payments/checkout`.
- [ ] Connects the application SDK `AccessDenied` with the CloudTrail `s3:PutObject` denial.
- [ ] Identifies the trust subject mismatch between `default/checkout` and `payments/checkout`.
- [ ] Connects CloudTrail `AccessDenied` on `s3:PutObject` to bucket and key-prefix evidence.
- [ ] Separates trust-policy ownership from permission-policy ownership and avoids wildcard fixes.
- [ ] Defines exact trust, least-privilege permission scope, validation, and rollout handoff.

## Cleanup commands

- bash labs/platform-academy/debug-irsa-access-denied/cleanup.sh

## No-cluster fallback

- [ ] Review triage-notes.md, serviceaccount.yaml, workload-error.log, trust-policy.json, and cloudtrail-event.json as exported evidence.
- [ ] Write whether the immediate blocker is trust subject mismatch, permission scope, or both.
