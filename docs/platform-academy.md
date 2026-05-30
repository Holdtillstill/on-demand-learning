# Platform Academy

Platform Academy is a standalone local-first learning app for AWS, Kubernetes, SRE, and platform engineering. It shares the FastAPI backend, database, progress, XP, and lesson APIs with the Zhongwen app, but it has its own React/Vite frontend, brand, navigation, guest profile model, resources, interview prep, and Docker Compose service.

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
- Resources API: http://localhost:8000/api/platform-academy/resources
- Interview prep API: http://localhost:8000/api/platform-academy/interview-prep

The academy is instructional and local-first. Do not run `terraform apply`, do not deploy to AWS, and do not add real credentials. AWS CLI examples are labeled as inspection/design examples, not required commands for this repo.

## Level Structure

The catalog is organized into three learning levels, forming a zero-to-hero path from Linux/networking basics through senior platform ownership and job-search readiness.

### Fresher / Beginner

- Kubernetes Fundamentals: containers, images, Pods, Deployments, ReplicaSets, Services, namespaces, labels/selectors, ConfigMaps, Secrets, resource requests, and probes.
- kubectl Debugging Basics: `get`, `describe`, `logs`, events, `exec`, port-forward, CrashLoopBackOff, ImagePullBackOff, Pending Pods, scheduling messages, and probe failures.
- Cloud Native Foundations: Docker images, tags/digests, registries, YAML, dry-run, environment promotion, service DNS, ports, resource requests, and memory failure signals.
- Linux and Command Line Foundations: shell navigation, file inspection, processes, exit codes, logs, users/groups, permissions, sudo, and text pipelines for evidence gathering.
- Networking Foundations for Kubernetes: IPs, ports, routing, DNS, HTTP, TLS, Ingress, load balancing, NetworkPolicy, and firewall reasoning.
- Docker Image and Supply Chain Operations: Dockerfile runtime contracts, multi-stage builds, tags, digests, registries, image scanning, SBOMs, non-root runtime, and artifact promotion.

### Intermediate

- EKS Operations: VPC CNI, IP exhaustion, managed node groups, Fargate vs EC2, IRSA/OIDC, controller permissions, add-ons, and AWS Load Balancer Controller troubleshooting.
- Helm for Application Delivery: chart anatomy, values as an API, values layering, templates, helpers, lint/template/diff, upgrade safety, rollbacks, hooks, CRDs, and supply chain review.
- ArgoCD GitOps: Applications, desired vs live state, app-of-apps, AppProjects, sync waves, pruning, self-heal, drift, secrets, environments, and rollback through Git.
- Terraform for AWS Platform Infrastructure: state, backends, locking, modules, variables, VPC/EKS resources, plan review, drift, safe changes, and cost/security blast radius.
- AWS IAM for EKS and Platform Teams: policy evaluation, AssumeRole, trust policies, STS, IRSA, Pod Identity, CloudTrail, and controller least-privilege reviews.
- AWS Operations Foundations for Platform Engineers: Well-Architected operations, CloudWatch, VPC paths, Route 53, ALB health, reliability reviews, backups, and change safety.

### Advanced

- Production EKS Architecture: private endpoints, access paths, Karpenter, NodePools, multi-AZ placement, zonal storage, cost guardrails, and cluster upgrade planning.
- Kubernetes Security and Multi-tenancy: RBAC, `kubectl auth can-i`, NetworkPolicy, Pod Security Standards, admission policy, secret strategy, rotation, and tenant blast radius.
- SRE and Observability for Kubernetes: RED/USE metrics, Prometheus/Grafana, logs, traces, SLOs, error budgets, burn-rate alerts, alert routing, runbooks, and post-incident learning.
- CI/CD and Release Engineering: quality gates, immutable artifact promotion, image signing, SBOMs, progressive delivery, rollback, canaries, pipeline security, and deploy permissions.
- Platform Engineering Operating Model: golden paths, internal developer experience, service ownership, production readiness, platform APIs, Backstage-style templates, KPIs, and adoption metrics.
- Observability and Telemetry Engineering: metrics, logs, traces, OpenTelemetry, context propagation, sampling, Prometheus alert quality, cardinality, dashboards, and telemetry operations.
- Incident Response and Reliability Leadership: incident command, severity, timelines, communications, mitigation, postmortems, corrective actions, and game days.
- FinOps for Kubernetes and AWS Platforms: cost visibility, ownership, tags, Kubernetes requests, EKS cost drivers, right-sizing, guardrails, and cost-review cadence.
- Platform Engineering Job Search Sprint: skill gap maps, portfolio evidence, resume bullets, recruiter screens, STAR stories, and a 30-day interview-prep operating plan.

Current seed count: 21 courses, 84 lessons, 21 labs, 320 reusable resources, and 219 interview questions.

## How To Learn From It

Use the roadmap in order if you are building fundamentals. Start with Fresher lessons until the object model and debugging commands feel natural, then move into EKS/Helm/ArgoCD. Use Advanced courses after you can already read manifests and debug common workload failures.

For each lesson:

- Read the concept section and identify the production tradeoff.
- Run only local-safe commands against a local cluster if you have one.
- Treat AWS and ArgoCD commands as examples unless you are in an approved sandbox.
- Study the key terms until you can explain them without notes.
- Use review flashcards for recall.
- Mark the lesson complete to update `/api/progress` and dashboard XP.

## Resource Library

Codex identified the biggest remaining gap as a reusable resources/projects layer: learners need artifacts they can return to while building real portfolio-grade systems. The app now exposes `/resources` and `/api/platform-academy/resources` with filters for domain and artifact type.

Resource domains include Linux, Networking, Docker, Kubernetes, kubectl, Cloud Native, EKS, Terraform, AWS IAM, AWS Operations, Helm, ArgoCD, CI/CD, Security, SRE, Observability, Incident Response, FinOps, Platform Engineering, and Career.

Resource types include:

- Cheatsheets.
- Runbooks.
- Lab worksheets.
- Project briefs.
- Interview prep.
- Official reference paths.
- Architecture diagram prompts.
- Templates.
- Assessments.
- Troubleshooting guides.
- Decision records.
- Production readiness checklists.
- Failure mode drills.
- Security reviews.
- Cost reviews.
- Portfolio artifacts.

Each resource includes prerequisites, outcomes, safety level, commands, expected artifacts, related labs, and next steps.

## Labs

Each course has a lab tied to a real lesson ID:

- Trace Service traffic to ready Pods.
- Separate CrashLoopBackOff from ImagePullBackOff.
- Review Kubernetes YAML before apply.
- Inspect Linux failure evidence.
- Trace an HTTP request across the network path.
- Review a Docker image supply chain.
- Diagnose EKS Pod IP exhaustion.
- Validate a Helm release artifact.
- Trace an ArgoCD drift report.
- Review a Terraform EKS plan.
- Debug IRSA AccessDenied for a Pod.
- Debug an AWS ALB health path.
- Run a production EKS architecture review.
- Audit Kubernetes tenant boundaries.
- Write an SLO-backed Kubernetes runbook.
- Design an OpenTelemetry signal path.
- Run an incident commander tabletop.
- Audit EKS cost drivers.
- Design a safe Kubernetes release pipeline.
- Create a service golden path.
- Build a platform career proof pack.

Labs are written as realistic production drills with commands, signals to inspect, and checklists. They avoid cloud mutation and are safe to discuss, rehearse, or adapt to a local kind/minikube cluster.

## Product Boundary

Platform Academy is no longer a nav item inside the Zhongwen app. The Zhongwen frontend remains focused on Mandarin, Chinese literature, art, characters, reviews, and admin upload. Direct platform lesson URLs still render in the Zhongwen lesson viewer because both apps use the same `/api/lessons/:id` endpoint, but the main platform learning experience lives at http://localhost:8090.

## Next Iterations

- Add downloadable kind manifests for selected labs.
- Add lab worksheet state, answers, and rubric feedback.
- Add platform-specific achievements such as `cluster_debugger`, `helm_release_operator`, and `gitops_owner`.
- Add a mock incident simulator that emits local metrics/logs for observability labs.
- Add Alembic migrations before a production-grade persistent deployment.
- Add a split static public catalog if a read-only CloudFront/S3 surface becomes useful.
