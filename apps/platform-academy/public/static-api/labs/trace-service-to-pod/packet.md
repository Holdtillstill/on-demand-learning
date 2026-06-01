# Trace Service traffic to ready Pods

Track: Kubernetes
Level: Fresher / Beginner
Lab tier: full
Estimated time: 30 minutes

## Scenario

A Service exists but traffic returns 503 because labels and readiness do not line up.

## Guided run sequence

1. Prepare workspace
   - A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.
   - kubectl configured to the local/sandbox context.
   - Run commands from the repository root so the lab manifest paths resolve.
   - bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
2. Investigate safely
   - Read the Service selector and write down the label key/value it expects.
   - Compare that selector with the labels on the checkout Pods.
   - Confirm whether EndpointSlices have ready backend addresses.
   - Use the local analyzer to prove the selector mismatch and source-manifest fix.
3. Prove the finding
   - The Service selector starts as app=checkout.
   - The checkout Pods are labeled app=checkout-api.
   - EndpointSlice output has no ready checkout backend addresses until the selector is fixed.
   - The local analyzer reports Service routing analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/trace-service-to-pod/cleanup.sh
   - Run bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md to copy the evidence template and print the captured transcript.
   - Open labs/platform-academy/trace-service-to-pod/start.yaml and compare the Service selector with the Deployment Pod template labels.
   - Write the one-line YAML change needed to make the Service select the running Pods.

## Evidence artifact map

- `labs/platform-academy/trace-service-to-pod/start.yaml` - Starting evidence
- `labs/platform-academy/trace-service-to-pod/fixed.yaml` - Target artifact
- `labs/platform-academy/trace-service-to-pod/broken-evidence.txt` - Starting evidence
- `labs/platform-academy/trace-service-to-pod/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/cluster-safety.sh` - Target artifact
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/trace-service-to-pod/service_route_analyzer.py` - Lab artifact
- `labs/platform-academy/trace-service-to-pod/setup.sh` - Lab artifact
- `labs/platform-academy/trace-service-to-pod/validate.sh` - Self-check script
- `labs/platform-academy/trace-service-to-pod/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/trace-service-to-pod/start.yaml
- labs/platform-academy/trace-service-to-pod/fixed.yaml
- labs/platform-academy/trace-service-to-pod/broken-evidence.txt
- labs/platform-academy/trace-service-to-pod/evidence-template.md
- labs/platform-academy/lib/cluster-safety.sh
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/trace-service-to-pod/service_route_analyzer.py
- labs/platform-academy/trace-service-to-pod/setup.sh
- labs/platform-academy/trace-service-to-pod/validate.sh
- labs/platform-academy/trace-service-to-pod/cleanup.sh

## Worksheet prompts

- [ ] Record the current context or no-cluster transcript used, namespace, and cleanup command before changing anything.
- [ ] Paste the Service selector evidence and the exact label key/value the Service expects.
- [ ] Paste the Pod label evidence and the exact label key/value the running Pods expose.
- [ ] Paste the EndpointSlice evidence before the fix and explain why the Service has no ready backends.
- [ ] Write the smallest source-manifest fix and why a one-off live Service patch is not enough.
- [ ] Capture post-fix EndpointSlice validation and cleanup or no-cluster fallback evidence.

## Prerequisites

- [ ] A local Kubernetes cluster such as kind, minikube, Docker Desktop Kubernetes, or an approved sandbox cluster.
- [ ] kubectl configured to the local/sandbox context.
- [ ] Run commands from the repository root so the lab manifest paths resolve.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
- bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod
- bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --preflight
- bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster
- kubectl config current-context
- kubectl apply -f labs/platform-academy/trace-service-to-pod/start.yaml
- kubectl wait --for=condition=available deploy/checkout -n payments --timeout=90s
- kubectl get svc,pods,endpointslice -n payments

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace trace-service-to-pod --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip trace-service-to-pod-learner-workspace.zip
- cd trace-service-to-pod
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Optional cluster workflow

- From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod
- From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight
- Create the broken lab state: ./setup.sh --cluster
- After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster
- Clean up the lab namespace/resources: ./cleanup.sh
- No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace.

## Practice steps

- [ ] Read the Service selector and write down the label key/value it expects.
- [ ] Compare that selector with the labels on the checkout Pods.
- [ ] Confirm whether EndpointSlices have ready backend addresses.
- [ ] Use the local analyzer to prove the selector mismatch and source-manifest fix.
- [ ] Apply the fixed manifest only after you can explain why the starting manifest fails.

## Runbook commands

- kubectl describe svc checkout -n payments
- kubectl get pods -n payments --show-labels
- kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout
- python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py --start labs/platform-academy/trace-service-to-pod/start.yaml --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt

## Expected evidence

- [ ] The Service selector starts as app=checkout.
- [ ] The checkout Pods are labeled app=checkout-api.
- [ ] EndpointSlice output has no ready checkout backend addresses until the selector is fixed.
- [ ] The local analyzer reports Service routing analysis passed.

## Validation commands

- bash labs/platform-academy/trace-service-to-pod/validate.sh
- bash labs/platform-academy/trace-service-to-pod/validate.sh --evidence /tmp/trace-service-evidence.md
- bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --cluster
- python3 labs/platform-academy/trace-service-to-pod/service_route_analyzer.py --start labs/platform-academy/trace-service-to-pod/start.yaml --fixed labs/platform-academy/trace-service-to-pod/fixed.yaml --transcript labs/platform-academy/trace-service-to-pod/broken-evidence.txt
- kubectl apply -f labs/platform-academy/trace-service-to-pod/fixed.yaml
- kubectl get endpointslice -n payments -l kubernetes.io/service-name=checkout -o wide
- kubectl get pods -n payments -l app=checkout-api --show-labels

## Validation checks

- [ ] Safety context or no-cluster transcript recorded
- [ ] Service selector evidence captured
- [ ] Pod label evidence captured
- [ ] EndpointSlice empty-backend evidence captured
- [ ] Source manifest fix identified
- [ ] Post-fix EndpointSlice validation and local analysis captured
- [ ] Cleanup or fallback note recorded

## Rubric

- [ ] Names the namespace, context or transcript source, and cleanup boundary before acting.
- [ ] Captures Service selector evidence with the exact `app=checkout` value.
- [ ] Captures Pod label evidence with the exact `app=checkout-api` value.
- [ ] Explains why a healthy Deployment can still produce empty EndpointSlices.
- [ ] Chooses the source-manifest Service selector fix instead of a console or live-only patch.
- [ ] Verifies ready EndpointSlice backends after the fix and records cleanup or fallback evidence.

## Cleanup commands

- bash labs/platform-academy/trace-service-to-pod/cleanup.sh

## No-cluster fallback

- [ ] Run bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md to copy the evidence template and print the captured transcript.
- [ ] Open labs/platform-academy/trace-service-to-pod/start.yaml and compare the Service selector with the Deployment Pod template labels.
- [ ] Write the one-line YAML change needed to make the Service select the running Pods.
