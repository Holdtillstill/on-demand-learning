# Separate CrashLoopBackOff from ImagePullBackOff

Track: kubectl
Level: Fresher / Beginner
Lab tier: full
Estimated time: 35 minutes

## Scenario

A rollout produced failing Pods, and you need to determine whether the image cannot pull or the app crashes after start.

## Guided run sequence

1. Prepare workspace
   - A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.
   - kubectl configured to the local/sandbox context.
   - Network access for pulling busybox and nginx images, or preloaded images in the cluster.
   - bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md
2. Investigate safely
   - Read the triage notes and rule out restart, resource, and node-pressure false leads.
   - Use describe output to identify which Pod started and then exited.
   - Use previous logs only for the container that actually started.
   - Use events to identify the Pod that never started because the image could not be pulled.
3. Prove the finding
   - The triage notes show restarting Pods and increasing resources are not supported by the evidence.
   - The checkout-crash Pod reaches CrashLoopBackOff and has previous logs that say missing DB_URL.
   - The checkout-pull Pod reaches ErrImagePull or ImagePullBackOff and has image pull events.
   - Previous logs are useful for CrashLoopBackOff but not for a container that never pulled.
4. Reset or hand off
   - bash labs/platform-academy/debug-crashloop-imagepull/cleanup.sh
   - Run bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md to copy the evidence template and print the captured transcript.
   - Read labs/platform-academy/debug-crashloop-imagepull/triage-notes.md and record which false leads were ruled out.
   - Open labs/platform-academy/debug-crashloop-imagepull/start.yaml and identify which Deployment can start and which one cannot pull an image.

## Evidence artifact map

- `labs/platform-academy/debug-crashloop-imagepull/start.yaml` - Starting evidence
- `labs/platform-academy/debug-crashloop-imagepull/fixed.yaml` - Target artifact
- `labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt` - Starting evidence
- `labs/platform-academy/debug-crashloop-imagepull/triage-notes.md` - Decision note
- `labs/platform-academy/debug-crashloop-imagepull/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/cluster-safety.sh` - Target artifact
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py` - Lab artifact
- `labs/platform-academy/debug-crashloop-imagepull/setup.sh` - Lab artifact
- `labs/platform-academy/debug-crashloop-imagepull/validate.sh` - Self-check script
- `labs/platform-academy/debug-crashloop-imagepull/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/debug-crashloop-imagepull/start.yaml
- labs/platform-academy/debug-crashloop-imagepull/fixed.yaml
- labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt
- labs/platform-academy/debug-crashloop-imagepull/triage-notes.md
- labs/platform-academy/debug-crashloop-imagepull/evidence-template.md
- labs/platform-academy/lib/cluster-safety.sh
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py
- labs/platform-academy/debug-crashloop-imagepull/setup.sh
- labs/platform-academy/debug-crashloop-imagepull/validate.sh
- labs/platform-academy/debug-crashloop-imagepull/cleanup.sh

## Worksheet prompts

- [ ] Record the current context or no-cluster transcript used, namespace, and cleanup command before changing anything.
- [ ] Read triage-notes.md and list the False Leads ruled out before splitting the owners.
- [ ] Classify each workload by status and whether its container actually started.
- [ ] Paste the CrashLoopBackOff Last State, exit code, and previous-log evidence.
- [ ] Paste the ImagePullBackOff image reference and event reason evidence.
- [ ] Assign the app/config owner action and the image/registry owner action separately.
- [ ] Capture rollout validation and cleanup or no-cluster fallback evidence.

## Prerequisites

- [ ] A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.
- [ ] kubectl configured to the local/sandbox context.
- [ ] Network access for pulling busybox and nginx images, or preloaded images in the cluster.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md
- sed -n '1,220p' labs/platform-academy/debug-crashloop-imagepull/triage-notes.md
- bash labs/platform-academy/bootstrap-local-cluster.sh --preflight debug-crashloop-imagepull
- bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --preflight
- bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --cluster
- kubectl config current-context
- kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/start.yaml
- kubectl get pods -n payments-debug

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace debug-crashloop-imagepull --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip debug-crashloop-imagepull-learner-workspace.zip
- cd debug-crashloop-imagepull
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Optional cluster workflow

- From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight debug-crashloop-imagepull
- From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight
- Create the broken lab state: ./setup.sh --cluster
- After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster
- Clean up the lab namespace/resources: ./cleanup.sh
- No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace.

## Practice steps

- [ ] Read the triage notes and rule out restart, resource, and node-pressure false leads.
- [ ] Use describe output to identify which Pod started and then exited.
- [ ] Use previous logs only for the container that actually started.
- [ ] Use events to identify the Pod that never started because the image could not be pulled.
- [ ] Use the local analyzer to prove the CrashLoop/ImagePull split and ownership boundary.
- [ ] State which fix belongs to app/config and which fix belongs to image registry or manifest ownership.

## Runbook commands

- kubectl describe pods -n payments-debug -l app=checkout-crash
- kubectl logs -n payments-debug -l app=checkout-crash --previous
- kubectl describe pods -n payments-debug -l app=checkout-pull
- kubectl get events -n payments-debug --sort-by=.lastTimestamp

## Expected evidence

- [ ] The triage notes show restarting Pods and increasing resources are not supported by the evidence.
- [ ] The checkout-crash Pod reaches CrashLoopBackOff and has previous logs that say missing DB_URL.
- [ ] The checkout-pull Pod reaches ErrImagePull or ImagePullBackOff and has image pull events.
- [ ] Previous logs are useful for CrashLoopBackOff but not for a container that never pulled.
- [ ] The local analyzer reports CrashLoop/ImagePull analysis passed.

## Validation commands

- bash labs/platform-academy/debug-crashloop-imagepull/validate.sh
- bash labs/platform-academy/debug-crashloop-imagepull/validate.sh --evidence /tmp/crashloop-imagepull-evidence.md
- bash labs/platform-academy/run-lab.sh validate debug-crashloop-imagepull --cluster
- python3 labs/platform-academy/debug-crashloop-imagepull/failure_mode_analyzer.py --start labs/platform-academy/debug-crashloop-imagepull/start.yaml --fixed labs/platform-academy/debug-crashloop-imagepull/fixed.yaml --transcript labs/platform-academy/debug-crashloop-imagepull/broken-evidence.txt
- kubectl apply -f labs/platform-academy/debug-crashloop-imagepull/fixed.yaml
- kubectl rollout status deploy/checkout-crash -n payments-debug --timeout=90s
- kubectl rollout status deploy/checkout-pull -n payments-debug --timeout=90s
- kubectl get pods -n payments-debug

## Validation checks

- [ ] Safety context or no-cluster transcript recorded
- [ ] Triage False Leads ruled out
- [ ] Failure modes classified
- [ ] CrashLoopBackOff previous-log evidence captured
- [ ] ImagePullBackOff event evidence captured
- [ ] Owners and fixes separated
- [ ] Rollout validation and local analysis captured
- [ ] Cleanup or fallback note recorded

## Rubric

- [ ] Separates CrashLoopBackOff from ImagePullBackOff without mixing evidence sources.
- [ ] Uses triage notes to rule out restart, resource, node-pressure, and one-outage False Leads.
- [ ] Uses `logs --previous` only for the container that started and exited.
- [ ] Uses events and image reference evidence for the container that never started.
- [ ] Names `missing DB_URL` and exit code 42 as app/config evidence.
- [ ] Names the invalid registry reference as image/registry ownership evidence.
- [ ] Validates both fixed Deployments and records cleanup or fallback evidence.

## Cleanup commands

- bash labs/platform-academy/debug-crashloop-imagepull/cleanup.sh

## No-cluster fallback

- [ ] Run bash labs/platform-academy/run-lab.sh setup debug-crashloop-imagepull --evidence /tmp/crashloop-imagepull-evidence.md to copy the evidence template and print the captured transcript.
- [ ] Read labs/platform-academy/debug-crashloop-imagepull/triage-notes.md and record which false leads were ruled out.
- [ ] Open labs/platform-academy/debug-crashloop-imagepull/start.yaml and identify which Deployment can start and which one cannot pull an image.
- [ ] Write the first command you would run for each symptom and what signal you expect from it.
