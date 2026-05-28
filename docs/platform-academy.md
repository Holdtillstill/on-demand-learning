# Platform Academy

Platform Academy is a standalone local-first learning app for Kubernetes platform engineering. It shares the FastAPI backend, database, progress, XP, and lesson APIs with the Zhongwen app, but it has its own React/Vite frontend, brand, navigation, and Docker Compose service.

## Local Use

Start the local stack:

```bash
docker compose up --build
```

Open:

- Platform Academy frontend: http://localhost:8090
- Zhongwen frontend: http://localhost:8080
- Catalog API: http://localhost:8000/api/platform-academy/catalog
- Roadmap API: http://localhost:8000/api/platform-academy/roadmap
- Labs API: http://localhost:8000/api/platform-academy/labs

The academy is instructional and local-first. Do not run `terraform apply`, do not deploy to AWS, and do not add real credentials. AWS CLI examples are labeled as inspection/design examples, not required commands for this repo.

## Level Structure

The catalog is organized into three learning levels with five courses each, forming a zero-to-hero path from Linux/networking basics through senior platform ownership.

### Fresher / Beginner

- Kubernetes Fundamentals: containers, images, Pods, Deployments, ReplicaSets, Services, namespaces, labels/selectors, ConfigMaps, Secrets, resource requests, and probes.
- kubectl Debugging Basics: `get`, `describe`, `logs`, events, `exec`, port-forward, CrashLoopBackOff, ImagePullBackOff, Pending Pods, scheduling messages, and probe failures.
- Cloud Native Foundations: Docker images, tags/digests, registries, YAML, dry-run, environment promotion, service DNS, ports, resource requests, and memory failure signals.
- Linux and Command Line Foundations: shell navigation, file inspection, processes, exit codes, logs, users/groups, permissions, sudo, and text pipelines for evidence gathering.
- Networking Foundations for Kubernetes: IPs, ports, routing, DNS, HTTP, TLS, Ingress, load balancing, NetworkPolicy, and firewall reasoning.

### Intermediate

- EKS Operations: VPC CNI, IP exhaustion, managed node groups, Fargate vs EC2, IRSA/OIDC, controller permissions, add-ons, and AWS Load Balancer Controller troubleshooting.
- Helm for Application Delivery: chart anatomy, values as an API, values layering, templates, helpers, lint/template/diff, upgrade safety, rollbacks, hooks, CRDs, and supply chain review.
- ArgoCD GitOps: Applications, desired vs live state, app-of-apps, AppProjects, sync waves, pruning, self-heal, drift, secrets, environments, and rollback through Git.
- Terraform for AWS Platform Infrastructure: state, backends, locking, modules, variables, VPC/EKS resources, plan review, drift, safe changes, and cost/security blast radius.
- AWS IAM for EKS and Platform Teams: policy evaluation, AssumeRole, trust policies, STS, IRSA, Pod Identity, CloudTrail, and controller least-privilege reviews.

### Advanced

- Production EKS Architecture: private endpoints, access paths, Karpenter, NodePools, multi-AZ placement, zonal storage, cost guardrails, and cluster upgrade planning.
- Kubernetes Security and Multi-tenancy: RBAC, `kubectl auth can-i`, NetworkPolicy, Pod Security Standards, admission policy, secret strategy, rotation, and tenant blast radius.
- SRE and Observability for Kubernetes: RED/USE metrics, Prometheus/Grafana, logs, traces, SLOs, error budgets, burn-rate alerts, alert routing, runbooks, and post-incident learning.
- CI/CD and Release Engineering: quality gates, immutable artifact promotion, image signing, SBOMs, progressive delivery, rollback, canaries, pipeline security, and deploy permissions.
- Platform Engineering Operating Model: golden paths, internal developer experience, service ownership, production readiness, platform APIs, Backstage-style templates, KPIs, and adoption metrics.

Current seed count: 15 courses, 60 lessons, and 15 labs.

## How To Learn From It

Use the roadmap in order if you are building fundamentals. Start with Fresher lessons until the object model and debugging commands feel natural, then move into EKS/Helm/ArgoCD. Use Advanced courses after you can already read manifests and debug common workload failures.

For each lesson:

- Read the concept section and identify the production tradeoff.
- Run only local-safe commands against a local cluster if you have one.
- Treat AWS and ArgoCD commands as examples unless you are in an approved sandbox.
- Study the key terms until you can explain them without notes.
- Use review flashcards for recall.
- Mark the lesson complete to update `/api/progress` and dashboard XP.

## Labs

Each course has a lab tied to a real lesson ID:

- Trace Service traffic to ready Pods.
- Separate CrashLoopBackOff from ImagePullBackOff.
- Review Kubernetes YAML before apply.
- Inspect Linux failure evidence.
- Trace an HTTP request across the network path.
- Diagnose EKS Pod IP exhaustion.
- Validate a Helm release artifact.
- Trace an ArgoCD drift report.
- Review a Terraform EKS plan.
- Debug IRSA AccessDenied for a Pod.
- Run a production EKS architecture review.
- Audit Kubernetes tenant boundaries.
- Write an SLO-backed Kubernetes runbook.
- Design a safe Kubernetes release pipeline.
- Create a service golden path.

Labs are written as realistic production drills with commands, signals to inspect, and checklists. They avoid cloud mutation and are safe to discuss, rehearse, or adapt to a local kind/minikube cluster.

## Product Boundary

Platform Academy is no longer a nav item inside the Zhongwen app. The Zhongwen frontend remains focused on Mandarin, Chinese literature, art, characters, reviews, and admin upload. Direct platform lesson URLs still render in the Zhongwen lesson viewer because both apps use the same `/api/lessons/:id` endpoint, but the main platform learning experience lives at http://localhost:8090.

## Next Iterations

- Add downloadable kind manifests for selected labs.
- Add lab worksheet state, answers, and rubric feedback.
- Add platform-specific achievements such as `cluster_debugger`, `helm_release_operator`, and `gitops_owner`.
- Add a mock incident simulator that emits local metrics/logs for observability labs.
