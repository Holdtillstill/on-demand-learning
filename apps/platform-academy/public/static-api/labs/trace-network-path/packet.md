# Trace an HTTP request across the network path

Track: Networking
Level: Fresher / Beginner
Lab tier: full
Estimated time: 40 minutes

## Scenario

Users see intermittent 503 responses and you need to locate whether the error starts at DNS, ALB, Ingress, Service, or Pod readiness.

## Guided run sequence

1. Prepare workspace
   - No DNS, ALB, or Kubernetes access required for the default path; this lab uses captured network evidence.
   - Optional cluster mode requires a disposable local Kubernetes context.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup trace-network-path
2. Investigate safely
   - Start from the pager handoff and preserve the no-live-change boundary.
   - Use hop-trace.md to rule out DNS, ALB listener, Pod recreation, and console-only false leads.
   - Identify which hop emits the 503.
   - Compare ALB target health with Kubernetes Service and Pod port names.
3. Prove the finding
   - The incident handoff names the checkout health path impact and safety boundary.
   - The hop trace records DNS, ALB, Ingress, Service, and Pod owner notes.
   - The client receives a 503 from awselb.
   - One target is unhealthy with response code mismatch.
4. Reset or hand off
   - bash labs/platform-academy/trace-network-path/cleanup.sh
   - Use incident-handoff.md, hop-trace.md, and network-evidence.md as a captured request trace.
   - Write the hop-by-hop owner note without live DNS or ALB access.

## Evidence artifact map

- `labs/platform-academy/trace-network-path/incident-handoff.md` - Decision note
- `labs/platform-academy/trace-network-path/hop-trace.md` - Decision note
- `labs/platform-academy/trace-network-path/network-evidence.md` - Decision note
- `labs/platform-academy/trace-network-path/ingress-service.yaml` - Manifest
- `labs/platform-academy/trace-network-path/fixed-ingress-service.yaml` - Target artifact
- `labs/platform-academy/trace-network-path/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/cluster-safety.sh` - Target artifact
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/trace-network-path/network_path_analyzer.py` - Lab artifact
- `labs/platform-academy/trace-network-path/setup.sh` - Lab artifact
- `labs/platform-academy/trace-network-path/validate.sh` - Self-check script
- `labs/platform-academy/trace-network-path/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/trace-network-path/incident-handoff.md
- labs/platform-academy/trace-network-path/hop-trace.md
- labs/platform-academy/trace-network-path/network-evidence.md
- labs/platform-academy/trace-network-path/ingress-service.yaml
- labs/platform-academy/trace-network-path/fixed-ingress-service.yaml
- labs/platform-academy/trace-network-path/evidence-template.md
- labs/platform-academy/lib/cluster-safety.sh
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/trace-network-path/network_path_analyzer.py
- labs/platform-academy/trace-network-path/setup.sh
- labs/platform-academy/trace-network-path/validate.sh
- labs/platform-academy/trace-network-path/cleanup.sh

## Worksheet prompts

- [ ] Record the incident handoff, host/path, evidence source, manifest files, and confirmation that no live DNS, ALB, or cluster change is being made.
- [ ] Use the Hop Trace to list DNS, ALB, Pod recreation, and console-only False Leads ruled out.
- [ ] Paste the client `HTTP/2 503`, `awselb/2.0` server header, DNS target, and expected traffic path.
- [ ] Paste the ALB `Target.ResponseCodeMismatch` target-health evidence and the unhealthy target status.
- [ ] Paste the Ingress backend, Service `targetPort web`, Pod port name `http`, and readiness or EndpointSlice evidence.
- [ ] Write which owners are ruled out, the source-manifest fix, owner split, and why this is not a DNS-only or ALB-console fix.
- [ ] Capture the fixed manifest diff, validation output, and cleanup or no-cluster note you would save.

## Prerequisites

- [ ] No DNS, ALB, or Kubernetes access required for the default path; this lab uses captured network evidence.
- [ ] Optional cluster mode requires a disposable local Kubernetes context.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup trace-network-path
- bash labs/platform-academy/trace-network-path/setup.sh --evidence /tmp/network-path-evidence.md
- sed -n '1,220p' labs/platform-academy/trace-network-path/incident-handoff.md
- sed -n '1,220p' labs/platform-academy/trace-network-path/hop-trace.md
- sed -n '1,220p' labs/platform-academy/trace-network-path/network-evidence.md
- bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-network-path
- bash labs/platform-academy/trace-network-path/setup.sh --preflight
- bash labs/platform-academy/trace-network-path/setup.sh --cluster --evidence /tmp/network-path-evidence.md

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup trace-network-path --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace trace-network-path --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip trace-network-path-learner-workspace.zip
- cd trace-network-path
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Optional cluster workflow

- From the full repo, create/select a disposable context: bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-network-path
- From this extracted bundle, after a disposable context is selected: ./setup.sh --preflight
- Create the broken lab state: ./setup.sh --cluster
- After filling evidence.md, verify files, evidence, and cluster state: ./validate.sh --cluster
- Clean up the lab namespace/resources: ./cleanup.sh
- No app namespace or Pods need to exist before setup; setup creates or recreates the lab namespace.

## Practice steps

- [ ] Start from the pager handoff and preserve the no-live-change boundary.
- [ ] Use hop-trace.md to rule out DNS, ALB listener, Pod recreation, and console-only false leads.
- [ ] Identify which hop emits the 503.
- [ ] Compare ALB target health with Kubernetes Service and Pod port names.
- [ ] Use the local analyzer to prove edge, ALB, Ingress, Service/Pod, fixed-target, and owner evidence.
- [ ] Decide whether the owner is DNS, ingress, Service, or application readiness.

## Runbook commands

- grep -n "DNS is not\|console-only\|targetPort: http" labs/platform-academy/trace-network-path/hop-trace.md
- grep -n "HTTP/2 503\|Target.ResponseCodeMismatch\|targetPort web" labs/platform-academy/trace-network-path/incident-handoff.md labs/platform-academy/trace-network-path/network-evidence.md labs/platform-academy/trace-network-path/ingress-service.yaml
- grep -n "name: http\|targetPort: web" labs/platform-academy/trace-network-path/ingress-service.yaml

## Expected evidence

- [ ] The incident handoff names the checkout health path impact and safety boundary.
- [ ] The hop trace records DNS, ALB, Ingress, Service, and Pod owner notes.
- [ ] The client receives a 503 from awselb.
- [ ] One target is unhealthy with response code mismatch.
- [ ] The Service targetPort is web while the Pod port is named http.
- [ ] The local analyzer reports Network path analysis passed.

## Validation commands

- bash labs/platform-academy/trace-network-path/validate.sh
- bash labs/platform-academy/trace-network-path/validate.sh --evidence /tmp/network-path-evidence.md
- python3 labs/platform-academy/trace-network-path/network_path_analyzer.py --handoff labs/platform-academy/trace-network-path/incident-handoff.md --evidence labs/platform-academy/trace-network-path/network-evidence.md --broken labs/platform-academy/trace-network-path/ingress-service.yaml --fixed labs/platform-academy/trace-network-path/fixed-ingress-service.yaml
- bash labs/platform-academy/run-lab.sh validate trace-network-path --cluster
- bash labs/platform-academy/trace-network-path/validate.sh --cluster
- grep -n "targetPort: web" labs/platform-academy/trace-network-path/ingress-service.yaml
- grep -n "name: http" labs/platform-academy/trace-network-path/ingress-service.yaml

## Validation checks

- [ ] Incident handoff and no-live-network-change safety boundary recorded
- [ ] Hop Trace False Leads ruled out
- [ ] Client 503 and DNS evidence captured
- [ ] ALB Target.ResponseCodeMismatch evidence captured
- [ ] Ingress backend evidence captured
- [ ] Service targetPort and Pod port evidence captured
- [ ] Owners ruled out plus source-manifest fix recorded
- [ ] Network path analysis, validation output, and cleanup/no-cluster evidence recorded

## Rubric

- [ ] Uses the incident handoff to preserve impact context and avoid live DNS, ALB, or cluster mutation.
- [ ] Uses the Hop Trace to rule out DNS, ALB listener, Pod recreation, and console-only False Leads.
- [ ] Captures `HTTP/2 503`, `awselb/2.0`, DNS target, and expected host/path route evidence.
- [ ] Names `Target.ResponseCodeMismatch` as the ALB target-health symptom instead of guessing.
- [ ] Connects Ingress backend, Service `targetPort web`, and Pod port name `http` to the failed hop.
- [ ] Rules out DNS and ALB-only ownership before choosing a source-manifest `targetPort: http` fix.
- [ ] Saves fixed-ingress-service diff, validation output, cleanup, and no-cluster evidence.

## Cleanup commands

- bash labs/platform-academy/trace-network-path/cleanup.sh

## No-cluster fallback

- [ ] Use incident-handoff.md, hop-trace.md, and network-evidence.md as a captured request trace.
- [ ] Write the hop-by-hop owner note without live DNS or ALB access.
