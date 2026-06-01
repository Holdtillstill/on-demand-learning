# Debug an AWS ALB health path

Track: AWS Operations
Level: Intermediate
Lab tier: full
Estimated time: 50 minutes

## Scenario

An ALB target group turns unhealthy after a Kubernetes deployment and users see intermittent 503 responses.

## Guided run sequence

1. Prepare workspace
   - No AWS credentials required for the default path; this lab uses local ALB and Kubernetes evidence.
   - Optional cluster mode requires a disposable local Kubernetes context.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup debug-aws-alb-health-path
2. Investigate safely
   - Confirm which target group symptom is failing.
   - Compare ALB health path with Ingress, Service, and Pod port evidence.
   - Use the local analyzer to prove ALB, health-path, Service/Pod, controller-event, and fixed-target evidence.
   - Name whether the owner is AWS networking, ingress controller, or app manifest.
3. Prove the finding
   - One target is unhealthy with Target.ResponseCodeMismatch.
   - Ingress healthcheck path is /healthz.
   - Service targetPort web does not match the Pod port named http.
   - The local analyzer reports ALB health path analysis passed.
4. Reset or hand off
   - bash labs/platform-academy/debug-aws-alb-health-path/cleanup.sh
   - Use target-health.json, ingress-service.yaml, and events.txt as exported evidence.
   - Write the owner and next action without AWS CLI access.

## Evidence artifact map

- `labs/platform-academy/debug-aws-alb-health-path/target-health.json` - Manifest
- `labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml` - Manifest
- `labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml` - Target artifact
- `labs/platform-academy/debug-aws-alb-health-path/events.txt` - Captured evidence
- `labs/platform-academy/debug-aws-alb-health-path/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/cluster-safety.sh` - Target artifact
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py` - Lab artifact
- `labs/platform-academy/debug-aws-alb-health-path/setup.sh` - Lab artifact
- `labs/platform-academy/debug-aws-alb-health-path/validate.sh` - Self-check script
- `labs/platform-academy/debug-aws-alb-health-path/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/debug-aws-alb-health-path/target-health.json
- labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
- labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml
- labs/platform-academy/debug-aws-alb-health-path/events.txt
- labs/platform-academy/debug-aws-alb-health-path/evidence-template.md
- labs/platform-academy/lib/cluster-safety.sh
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py
- labs/platform-academy/debug-aws-alb-health-path/setup.sh
- labs/platform-academy/debug-aws-alb-health-path/validate.sh
- labs/platform-academy/debug-aws-alb-health-path/cleanup.sh

## Worksheet prompts

- [ ] Record the evidence source, namespace, manifest files, and why no live AWS mutation is required.
- [ ] Paste the ALB target health reason, unhealthy target, and observed HTTP status.
- [ ] Paste the Ingress health check path and explain whether it matches the app contract.
- [ ] Paste the Service targetPort, Pod port name, and controller event that prove the routing mismatch.
- [ ] Assign owner actions across AWS networking, ingress/controller, and application teams.
- [ ] Write the source-manifest fix and the validation or rollout handoff you would require.

## Prerequisites

- [ ] No AWS credentials required for the default path; this lab uses local ALB and Kubernetes evidence.
- [ ] Optional cluster mode requires a disposable local Kubernetes context.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup debug-aws-alb-health-path
- bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --evidence /tmp/alb-health-path-evidence.md
- sed -n '1,160p' labs/platform-academy/debug-aws-alb-health-path/target-health.json
- bash labs/platform-academy/bootstrap-local-cluster.sh --preflight debug-aws-alb-health-path
- bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --preflight
- bash labs/platform-academy/debug-aws-alb-health-path/setup.sh --cluster --evidence /tmp/alb-health-path-evidence.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace debug-aws-alb-health-path --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip debug-aws-alb-health-path-learner-workspace.zip
- cd debug-aws-alb-health-path
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Optional cluster workflow

- From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight debug-aws-alb-health-path
- From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight
- Create the broken lab state: ./setup.sh --cluster
- After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster
- Clean up the lab namespace/resources: ./cleanup.sh
- No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace.

## Practice steps

- [ ] Confirm which target group symptom is failing.
- [ ] Compare ALB health path with Ingress, Service, and Pod port evidence.
- [ ] Use the local analyzer to prove ALB, health-path, Service/Pod, controller-event, and fixed-target evidence.
- [ ] Name whether the owner is AWS networking, ingress controller, or app manifest.

## Runbook commands

- grep -n "unhealthy\|ResponseCodeMismatch\|targetPort: web" labs/platform-academy/debug-aws-alb-health-path/target-health.json labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml
- grep -n "healthcheck-path\|targetPort web\|no matching Pod port" labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml labs/platform-academy/debug-aws-alb-health-path/events.txt
- python3 labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py --target-health labs/platform-academy/debug-aws-alb-health-path/target-health.json --events labs/platform-academy/debug-aws-alb-health-path/events.txt --broken labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml --fixed labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml

## Expected evidence

- [ ] One target is unhealthy with Target.ResponseCodeMismatch.
- [ ] Ingress healthcheck path is /healthz.
- [ ] Service targetPort web does not match the Pod port named http.
- [ ] The local analyzer reports ALB health path analysis passed.

## Validation commands

- bash labs/platform-academy/debug-aws-alb-health-path/validate.sh
- bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --evidence /tmp/alb-health-path-evidence.md
- python3 labs/platform-academy/debug-aws-alb-health-path/alb_health_analyzer.py --target-health labs/platform-academy/debug-aws-alb-health-path/target-health.json --events labs/platform-academy/debug-aws-alb-health-path/events.txt --broken labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml --fixed labs/platform-academy/debug-aws-alb-health-path/fixed-ingress-service.yaml
- bash labs/platform-academy/run-lab.sh validate debug-aws-alb-health-path --cluster
- bash labs/platform-academy/debug-aws-alb-health-path/validate.sh --cluster
- grep -n "Target.ResponseCodeMismatch" labs/platform-academy/debug-aws-alb-health-path/target-health.json
- grep -n "targetPort: web" labs/platform-academy/debug-aws-alb-health-path/ingress-service.yaml

## Validation checks

- [ ] Evidence source and no-live-mutation boundary recorded
- [ ] ALB target health reason captured
- [ ] Health check path reviewed
- [ ] Service-to-Pod port mismatch captured
- [ ] Controller event captured
- [ ] Owner decision written
- [ ] ALB health analysis, source-manifest fix, and validation handoff recorded

## Rubric

- [ ] Uses exported ALB and Kubernetes evidence without requiring AWS credentials.
- [ ] Names `Target.ResponseCodeMismatch` and the 404 health-check symptom.
- [ ] Connects `/healthz` to the application health endpoint contract instead of assuming AWS is broken.
- [ ] Explains why `targetPort: web` does not match the Pod port named `http`.
- [ ] Separates AWS networking, ingress/controller, and app-owner actions.
- [ ] Rejects console-only fixes and defines source-manifest validation or rollout handoff.

## Cleanup commands

- bash labs/platform-academy/debug-aws-alb-health-path/cleanup.sh

## No-cluster fallback

- [ ] Use target-health.json, ingress-service.yaml, and events.txt as exported evidence.
- [ ] Write the owner and next action without AWS CLI access.
