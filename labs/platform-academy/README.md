# Platform Academy Labs

These files back the runnable Platform Academy labs. Run commands from the repository root so relative paths match the app instructions and bundle metadata.

## Quick Start

Run every local-safe lab validator:

```bash
make platform-lab-verify
```

Run only the lab contract:

```bash
make platform-lab-contract
```

Run the portfolio-grade artifact contract:

```bash
make platform-lab-artifact-contract
```

Run the full-lab validator script directly:

```bash
bash labs/platform-academy/verify-full-labs.sh
```

Use the small lab runner when you want discovery plus single-lab commands:

```bash
bash labs/platform-academy/run-lab.sh list
bash labs/platform-academy/run-lab.sh show trace-service-to-pod
bash labs/platform-academy/run-lab.sh packet trace-service-to-pod > trace-service-to-pod-lab-packet.md
bash labs/platform-academy/run-lab.sh workspace trace-service-to-pod --dir /tmp/platform-academy-workspaces
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --run-analyzer --evidence /tmp/trace-service-evidence.md
bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --preflight
bash labs/platform-academy/run-lab.sh setup review-yaml-before-apply --evidence /tmp/yaml-review-evidence.md
bash labs/platform-academy/run-lab.sh setup debug-irsa-access-denied --run-simulator
bash labs/platform-academy/run-lab.sh validate trace-service-to-pod
bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --evidence /tmp/trace-service-evidence.md
bash labs/platform-academy/run-lab.sh validate trace-network-path --cluster
bash labs/platform-academy/run-lab.sh cleanup trace-service-to-pod
bash labs/platform-academy/run-lab.sh verify-all
```

Each lab also works as a standalone folder. Open the lab README, inspect the starting artifacts, make the expected fix or evidence note, then run its validator:

```bash
bash labs/platform-academy/run-lab.sh workspace trace-service-to-pod --dir /tmp/platform-academy-workspaces
cd /tmp/platform-academy-workspaces/trace-service-to-pod
./setup.sh
./validate.sh --files-only
./validate.sh
./cleanup.sh
```

Learner workspaces copy the lab packet, `evidence.md`, helper scripts, and inspection artifacts into `/tmp/platform-academy-workspaces/<slug>` by default. They use the generated packet as the workspace guide and withhold source `README.md` plus `solution.md` unless `--include-solution` is passed, so learners can work without editing canonical repo files or accidentally opening the answer key. The local workspace command and API workspace zip share the same generator, so manifest contents, helper scripts, and withheld source-only artifact rules stay aligned.

Setup scripts stage broken-state evidence first. They do not run lab analyzers or simulators by default; after inspecting the packet, pass `--run-analyzer` or `--run-simulator` when you want the local self-check output.

## Safety Model

- Kubernetes execution labs create disposable local namespaces or use `kubectl create --dry-run=client`.
- Cloud, AWS, EKS, ArgoCD, incident, FinOps, and career labs use captured evidence packs so they can run without credentials.
- Do not run the manifests against a shared production cluster.
- Use a disposable local or sandbox Kubernetes context, such as kind, minikube, Docker Desktop Kubernetes, or Rancher Desktop.
- Use `bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod` to create or select a disposable kind context when kind is installed, then run the lab preflight.
- Cluster mode refuses contexts outside `kind-*`, `minikube`, `docker-desktop`, and `rancher-desktop` unless `PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1` is set for an approved sandbox.
- Cluster setup supports `--preflight` to check `kubectl`, current context safety, API reachability, namespace permissions, and whether the lab namespace already exists before mutating anything.
- Cleanup scripts skip Kubernetes deletion when `kubectl` is missing, no context is selected, or the current context is not disposable.

If you have a disposable Kubernetes context and want to run the cluster-backed portions too:

```bash
bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --preflight
bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster
bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --cluster
bash labs/platform-academy/run-lab.sh validate trace-network-path --cluster
bash labs/platform-academy/run-lab.sh validate debug-aws-alb-health-path --cluster
bash labs/platform-academy/run-lab.sh validate audit-tenant-boundaries --cluster
bash labs/platform-academy/verify-full-labs.sh --cluster
```

## App Integration

- The API supports `full`, `guided`, and `evidence-pack` lab tiers; all current labs are `full`.
- Every current Platform Academy lab has a matching folder under this directory.
- The app generates a Markdown lab packet with learner artifact paths, setup commands, workspace command, worksheet prompts, validation checks, and rubric items.
- The app persists worksheet answers and validation state through the Platform Academy lab submission API, which returns deterministic rubric feedback and supports lab-queue status summaries plus the `/labs/history` evidence journal.
- The API lab payload exposes learner-safe `artifact_paths` only; public artifact paths match `learner_artifact_paths` and withhold source `README.md` plus `solution.md`.
- The API serves learner-safe workspace zips at `/api/platform-academy/labs/{slug}/workspace-bundle`; these include generated `README.md`, `evidence.md`, helper scripts, and inspection artifacts, but withhold source `README.md` and `solution.md`.
- The API also serves complete instructor/source artifact bundles at `/api/platform-academy/labs/{slug}/bundle`; these include `SOURCE-MANIFEST.txt`, source `README.md`, and `solution.md`. Outside local/test, source bundles require `X-Platform-Source-Bundle-Token` unless `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is intentionally set for a private environment.
- `simulator.py` emits deterministic local logs and Prometheus-style metrics for observability and incident labs.

## Evidence Note Self-Checks

Every full lab includes optional evidence-note validation. Fill out the copied evidence template, then run:

```bash
bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --evidence /tmp/trace-service-evidence.md
bash labs/platform-academy/run-lab.sh validate review-yaml-before-apply --evidence /tmp/yaml-review-evidence.md
bash labs/platform-academy/run-lab.sh validate design-safe-release-pipeline --evidence /tmp/release-pipeline-evidence.md
```

The runner exposes the same `--evidence` flag for all current lab slugs. These checks do not grade prose style; they catch missing incident facts, review blockers, owner split, validation, and cleanup or no-runtime handoff evidence before the learner submits a workbook.

## Deepened Practical Labs

These labs have extra captured evidence, worksheet templates, and lab-specific rubric prompts so they work even when the learner does not have a disposable cluster or AWS access:

- [`trace-service-to-pod`](trace-service-to-pod/README.md): triage notes, false leads, Service selector, Pod label, EndpointSlice, source-manifest fix, and cleanup evidence.
- [`debug-crashloop-imagepull`](debug-crashloop-imagepull/README.md): triage notes, false leads, CrashLoopBackOff vs ImagePullBackOff classification, previous-log evidence, event evidence, owner split, and rollout validation.
- [`review-yaml-before-apply`](review-yaml-before-apply/README.md): triage notes, false leads, manifest inventory, ClusterRole secret access, privileged mode, hostPath, credential placeholder, vendor questions, and no-live-apply evidence.
- [`inspect-linux-failure-evidence`](inspect-linux-failure-evidence/README.md): CrashLoopBackOff, exit code 126, permission denied, runtime UID/GID, rejected memory/root workarounds, and image-permission remediation evidence.
- [`trace-network-path`](trace-network-path/README.md): hop trace, false leads, client 503, DNS, ALB target-health reason, Ingress backend, Service targetPort, Pod port, owner handoff, and source-manifest fix evidence.
- [`debug-aws-alb-health-path`](debug-aws-alb-health-path/README.md): triage notes, false leads, ALB target health, health path contract, Service-to-Pod port mismatch, controller event, owner decision, and source-manifest handoff.
- [`diagnose-eks-ip-exhaustion`](diagnose-eks-ip-exhaustion/README.md): triage notes, false leads, scheduler pressure, CNI sandbox failures, subnet IPv4 exhaustion, maxPods, prefix delegation, owner split, and capacity remediation evidence.
- [`design-production-eks-review`](design-production-eks-review/README.md): endpoint posture, missing PDB, zonal storage, cost labels, upgrade/add-on risk, launch blockers, owners, and no-AWS review evidence.
- [`review-terraform-eks-plan`](review-terraform-eks-plan/README.md): EKS node group replacement, subnet and capacity regression, public ingress, broad IAM scope, rollback, and approval decision.
- [`debug-irsa-access-denied`](debug-irsa-access-denied/README.md): triage notes, false leads, Kubernetes identity, IAM trust subject mismatch, CloudTrail permission evidence, least-privilege scope, owner split, and rollout handoff.
- [`audit-tenant-boundaries`](audit-tenant-boundaries/README.md): triage notes, false leads, cluster-admin and secret access, Pod Security posture, NetworkPolicy false boundary, onboarding decision, owners, expiry, and cleanup evidence.
- [`validate-helm-release-artifact`](validate-helm-release-artifact/README.md): triage notes, false leads, immutable selector risk, mutable image tag, privileged runtime, LoadBalancer exposure, safer render, and release decision.
- [`trace-argocd-drift`](trace-argocd-drift/README.md): triage notes, false leads, desired/live replica drift, autoscaler ownership, Git-owned fields, narrow ignore rule, and field-owner decision.
- [`review-docker-image-supply-chain`](review-docker-image-supply-chain/README.md): triage notes, false leads, tag/digest proof, secret leakage, root runtime, oversized image, SBOM/scan, rollback digest, and promotion decision.
- [`design-safe-release-pipeline`](design-safe-release-pipeline/README.md): triage notes, false leads, direct main-to-production deploy, digest promotion, scan/SBOM/render/policy gates, staging proof, approval, canary, and SLO rollback evidence.
- [`create-platform-golden-path`](create-platform-golden-path/README.md): required inputs, generated artifacts, secure defaults, missing pager/SLO metadata, launch gates, adoption metrics, and product-decision evidence.
- [`write-slo-backed-runbook`](write-slo-backed-runbook/README.md): triage notes, false leads, SLO burn alert, rollout correlation, safe first commands, rollback criteria, owner split, validation, and follow-up evidence.
- [`design-opentelemetry-signal-path`](design-opentelemetry-signal-path/README.md): triage notes, false leads, sensitive-header deletion, missing trace context, metric cardinality risk, safer aggregation, owner map, and simulator evidence.
- [`run-incident-commander-tabletop`](run-incident-commander-tabletop/README.md): triage notes, false leads, SEV-2 impact, role assignment, rollback decision pressure, stakeholder update clock, timeline discipline, and handoff evidence.
- [`audit-eks-cost-drivers`](audit-eks-cost-drivers/README.md): over-requested workloads, unknown owners, abandoned LoadBalancer/PVC evidence, expected savings, reliability risk, rollback, and review cadence.
- [`build-platform-career-proof-pack`](build-platform-career-proof-pack/README.md): repeated skill demand, artifact mapping, public-safe redaction, proof README, resume bullets, STAR stories, and missing-proof evidence.

## Lab Catalog

All current labs are promoted beyond the baseline evidence-pack format. Each includes a folder README, expected solution, validation script, cleanup script, and any fixed target artifact needed to complete the exercise:

- [`trace-service-to-pod`](trace-service-to-pod/README.md)
- [`debug-crashloop-imagepull`](debug-crashloop-imagepull/README.md)
- [`review-yaml-before-apply`](review-yaml-before-apply/README.md)
- [`validate-helm-release-artifact`](validate-helm-release-artifact/README.md)
- [`trace-argocd-drift`](trace-argocd-drift/README.md)
- [`review-terraform-eks-plan`](review-terraform-eks-plan/README.md)
- [`debug-irsa-access-denied`](debug-irsa-access-denied/README.md)
- [`debug-aws-alb-health-path`](debug-aws-alb-health-path/README.md)
- [`trace-network-path`](trace-network-path/README.md)
- [`audit-tenant-boundaries`](audit-tenant-boundaries/README.md)
- [`design-safe-release-pipeline`](design-safe-release-pipeline/README.md)
- [`create-platform-golden-path`](create-platform-golden-path/README.md)
- [`review-docker-image-supply-chain`](review-docker-image-supply-chain/README.md)
- [`build-platform-career-proof-pack`](build-platform-career-proof-pack/README.md)
- [`diagnose-eks-ip-exhaustion`](diagnose-eks-ip-exhaustion/README.md)
- [`write-slo-backed-runbook`](write-slo-backed-runbook/README.md)
- [`design-production-eks-review`](design-production-eks-review/README.md)
- [`inspect-linux-failure-evidence`](inspect-linux-failure-evidence/README.md)
- [`design-opentelemetry-signal-path`](design-opentelemetry-signal-path/README.md)
- [`run-incident-commander-tabletop`](run-incident-commander-tabletop/README.md)
- [`audit-eks-cost-drivers`](audit-eks-cost-drivers/README.md)

## CI Contract

Verify the full-lab contract locally:

```bash
make platform-lab-contract
make platform-lab-artifact-contract
make platform-lab-verify
```

The artifact verifier parses the highest-value practical labs structurally. It checks the broken and fixed Kubernetes manifests, ArgoCD ignore rule, IAM trust and least-privilege policies, release workflow gates, and SLO alert rule instead of relying only on text snippets.

The lab contract also checks shell safety. Any lab script with mutating `kubectl` commands must source `lib/cluster-safety.sh` and call `require_disposable_kube_context` before the first mutation. Cleanup scripts must either use `delete_namespace_if_disposable` or clearly state that no cleanup is needed.

Setup scripts that execute analyzers or simulators must keep those commands behind explicit `--run-analyzer` or `--run-simulator` flags and print the staged-evidence prompt in the default path. This prevents setup from revealing the local self-check result before the learner has inspected the broken state.

## Cleanup

Kubernetes labs include guarded namespace delete commands in the app. If a run is interrupted, clean up manually only from a disposable or approved sandbox context:

```bash
kubectl delete namespace payments payments-debug --ignore-not-found
```
