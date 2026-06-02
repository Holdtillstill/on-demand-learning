# Platform Academy

Platform Academy is a standalone local-first learning app for AWS, Kubernetes, SRE, and platform engineering. It owns the React/Vite frontend and shares a FastAPI backend with worker, database, progress, XP, lesson, resource, lab, and interview-prep APIs.

## Local Use

Start the local stack:

```bash
docker compose up --build
```

Open:

- Platform Academy frontend: http://localhost:8090
- Catalog API: http://localhost:8000/api/platform-academy/catalog
- Roadmap API: http://localhost:8000/api/platform-academy/roadmap
- Labs API: http://localhost:8000/api/platform-academy/labs
- Resources API: http://localhost:8000/api/platform-academy/resources
- Interview prep API: http://localhost:8000/api/platform-academy/interview-prep

The academy is instructional and local-first. Do not run `terraform apply`, do not deploy to AWS, and do not add real credentials. AWS CLI examples are labeled as inspection/design examples, not required commands for this repo. Start hands-on lab work from [labs/platform-academy/README.md](../labs/platform-academy/README.md).

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
Interview prep also supports browser-local custom study plans: learners can save selected question sets from active or filtered prep packs and download a Markdown plan with related labs, resources, and official docs.
Portable guest backups include these local study plans alongside lesson progress, saved activity, and lab workbooks.

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

The resource library closes a key product gap: learners need reusable artifacts they can return to while building portfolio-grade systems. The app exposes `/resources` and `/api/platform-academy/resources` with filters for domain and artifact type.

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

Labs have been moved from short drill cards to repository-backed local exercises. Each current lab now includes setup or evidence files under `labs/platform-academy`, expected evidence, validation commands, cleanup guidance, no-cluster fallback notes, worksheet prompts, validation checks, learner artifact paths, instructor/source artifact paths, and a rubric.

Kubernetes labs can be run against a disposable local cluster or checked with client dry-run. `bash labs/platform-academy/bootstrap-local-cluster.sh --preflight <lab-slug>` creates or selects a disposable kind context when kind is installed, then runs the requested lab preflight. The cluster-backed setup scripts expose `setup --preflight` so learners can verify `kubectl`, context safety, API reachability, namespace permissions, and namespace state before creating or deleting anything; setup creates the lab namespace, so learners do not need an app namespace or Pods already running. AWS, EKS, ArgoCD, Terraform, incident, FinOps, and career labs use captured evidence packs so learners can practice without cloud credentials or live mutation. Observability and incident labs also include a small local signal simulator for fresh log and metric samples.

All 21 practical labs now include deeper evidence templates and captured transcripts or review packets: `trace-service-to-pod`, `debug-crashloop-imagepull`, `review-yaml-before-apply`, `inspect-linux-failure-evidence`, `trace-network-path`, `debug-aws-alb-health-path`, `diagnose-eks-ip-exhaustion`, `design-production-eks-review`, `review-terraform-eks-plan`, `debug-irsa-access-denied`, `audit-tenant-boundaries`, `validate-helm-release-artifact`, `trace-argocd-drift`, `review-docker-image-supply-chain`, `design-safe-release-pipeline`, `create-platform-golden-path`, `write-slo-backed-runbook`, `design-opentelemetry-signal-path`, `run-incident-commander-tabletop`, `audit-eks-cost-drivers`, and `build-platform-career-proof-pack`. These expose lab-specific workbook prompts, validation checks, rubric items, and evidence-aware rubric feedback through the API instead of relying only on generic worksheet prompts.

The current flagship incident/review labs also include richer handoff artifacts: `trace-network-path` has an incident pager handoff, `debug-irsa-access-denied` has workload-side SDK failure logs, and `trace-argocd-drift` has an ArgoCD application report with sync-policy context. Their validators require learners to use those artifacts instead of jumping straight to the fix.

Labs retain an explicit tier field for future content planning:

- `full`: folder-level lab with README, solution, validator, cleanup, and target artifacts.
- `guided`: guided design or implementation exercise with local artifacts.
- `evidence-pack`: captured production-style evidence for cloud or incident scenarios that should not require credentials.

All 21 current labs are promoted to the `full` tier with local READMEs, expected solutions, validation scripts, cleanup scripts, and fixed target artifacts where relevant:

- `trace-service-to-pod`
- `debug-crashloop-imagepull`
- `review-yaml-before-apply`
- `validate-helm-release-artifact`
- `trace-argocd-drift`
- `review-terraform-eks-plan`
- `debug-irsa-access-denied`
- `debug-aws-alb-health-path`
- `trace-network-path`
- `audit-tenant-boundaries`
- `design-safe-release-pipeline`
- `create-platform-golden-path`
- `review-docker-image-supply-chain`
- `build-platform-career-proof-pack`
- `diagnose-eks-ip-exhaustion`
- `write-slo-backed-runbook`
- `design-production-eks-review`
- `inspect-linux-failure-evidence`
- `design-opentelemetry-signal-path`
- `run-incident-commander-tabletop`
- `audit-eks-cost-drivers`

The lab detail page includes a guided run sequence, a learner-safe artifact map, a profile-backed workbook for worksheet answers, validation state, generated score, rubric feedback, an API-backed Markdown lab packet download at `/api/platform-academy/labs/{lab_slug}/packet`, a learner-safe workspace zip at `/api/platform-academy/labs/{lab_slug}/workspace-bundle`, and a complete instructor/source artifact bundle at `/api/platform-academy/labs/{lab_slug}/bundle`. The run sequence turns each lab into prepare, investigate, prove, and cleanup/handoff phases so learners can see how setup commands, evidence files, validators, and cleanup steps fit together before they start editing the workbook; the downloaded lab packet mirrors that sequence and artifact map. Public lab `artifact_paths` are learner-safe and match `learner_artifact_paths`; source `README.md` and `solution.md` stay out of the public learner payload. Learner workspace bundles and local `run-lab.sh workspace` folders include generated `README.md`, `evidence.md`, local `setup.sh` / `validate.sh` / `cleanup.sh` helpers, and inspection artifacts while withholding source `README.md` and `solution.md` by default. Instructor/source bundles include `SOURCE-MANIFEST.txt` plus the complete source artifact set for review and answer-key workflows; outside local/test/development they require `X-Platform-Source-Bundle-Token`, and `PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is rejected at API startup. The workbook still keeps a local browser copy as a fallback, but the primary state now persists through `/api/platform-academy/labs/{lab_slug}/submission/{user_id}` and `/api/platform-academy/labs/{lab_slug}/submission`.

Every full Platform Academy lab also exposes optional evidence-note self-checks through `validate.sh --evidence <file>` and `run-lab.sh validate <slug> --evidence <file>`. These checks verify that learner writeups name the critical incident facts, review blockers, owner split, validation, and cleanup or no-runtime handoff without requiring live AWS, CI, ArgoCD, or cluster credentials for captured-evidence labs.

All 21 full labs are flagged as portfolio-grade in the API and lab UI: `trace-service-to-pod`, `debug-crashloop-imagepull`, `review-yaml-before-apply`, `validate-helm-release-artifact`, `diagnose-eks-ip-exhaustion`, `design-production-eks-review`, `trace-network-path`, `debug-aws-alb-health-path`, `review-terraform-eks-plan`, `debug-irsa-access-denied`, `audit-tenant-boundaries`, `trace-argocd-drift`, `design-safe-release-pipeline`, `write-slo-backed-runbook`, `design-opentelemetry-signal-path`, `review-docker-image-supply-chain`, `audit-eks-cost-drivers`, `run-incident-commander-tabletop`, `create-platform-golden-path`, `inspect-linux-failure-evidence`, and `build-platform-career-proof-pack`. Their release gate parses key YAML, rendered Helm manifests, JSON, Docker image metadata/history, Linux failure evidence, FinOps usage/service/storage evidence, service golden-path metadata/contracts, incident command timeline/role evidence, career proof-pack artifacts, ALB target-health evidence, workflow, alert-rule, Terraform plan, OpenTelemetry collector and alert evidence, captured EKS review evidence, and Kubernetes tenant-boundary artifacts structurally, so the broken, risky, fixed, and portfolio-proof states are proven by contract instead of only by text search.

Rubric feedback is deterministic and local to the API. It compares worksheet notes with lab-specific evidence terms, validation state, and action language, then returns `missing`, `needs-evidence`, `passes`, or `strong` feedback for each rubric criterion. Deepened labs can attach criterion-specific evidence terms, so a learner who writes "the Service seems wrong" gets different feedback from a learner who cites `app=checkout`, `app=checkout-api`, and the empty EndpointSlice.

The app also loads `/api/platform-academy/lab-submissions/{user_id}` on startup so the dashboard, lab queue, and `/labs/history` evidence journal can show active workbooks, submitted state, rubric signals, evidence terms, and score without opening each lab. The journal exports a Markdown evidence report with worksheet notes, expected evidence, learner artifact paths, validation commands, and rubric follow-ups for portfolio notes or review.

Guest profiles can export and import a JSON backup from the recovery dialog. The API scopes backups to Platform Academy lesson progress, saved activity, and lab workbook submissions, so imported state can restore a guest workspace without mixing in unrelated lesson progress. Imported backups are bounded by row count and worksheet-answer size so the public demo endpoint cannot accept unbounded profile payloads.

### Portable Learner State API

Guest recovery uses two public API endpoints:

- `GET /api/platform-academy/state/{user_id}/export` returns a schema-versioned JSON backup for a guest profile.
- `POST /api/platform-academy/state/import` imports that backup into a target guest profile and returns row counts for progress, activity, and lab workbook submissions.

The backup contract is intentionally narrow. It contains Platform Academy lesson progress, Platform Academy saved activity, and Platform Academy lab workbook submissions only. It does not include unrelated course progress, credentials, secrets, or browser storage values.

Current payload limits:

- Guest learner profile key: 1 to 80 characters; letters, numbers, dot, underscore, colon, and hyphen only.
- Activity `target_type`, `target_id`, and `state`: letters, numbers, dot, underscore, colon, and hyphen only.
- Lab workbook status: `in_progress` or `submitted`.
- Progress rows: 120.
- Activity rows: 600.
- Lab submissions: 40.
- Worksheet fields per lab submission: 80.
- Checked fields per lab submission: 160.
- Worksheet and checked-item key length: 100 characters.
- Worksheet answer length: 4000 characters.
- Accepted backup schema version: 1.

The import endpoint ignores unknown non-platform lesson IDs and unknown lab slugs, then recalculates lab scores from the imported worksheet answers and checked items. Completed imported Platform Academy lessons regain lesson-completion XP for the target profile.

The Platform Academy dashboard now shows platform-specific achievement badges. These are awarded from persisted product signals such as completing a platform lesson, saving a resource review, practicing an interview question, and saving or submitting a full lab workbook.

Full-lab verification is scriptable with `bash labs/platform-academy/verify-full-labs.sh`. Cluster mode is available with `--cluster`, but the scripts refuse non-disposable Kubernetes contexts by default so a learner does not accidentally mutate an EKS or production context. Run `bash labs/platform-academy/bootstrap-local-cluster.sh --preflight trace-service-to-pod` when you want the repo to create/select a local kind context, or run `setup --preflight` before live setup when you already have a disposable context selected.

Prometheus exposes Platform Academy product counters for activity saves, guest recovery restores, lab workbook submissions, lab packet downloads, lab bundle downloads, and dashboard reads. The local Grafana overview includes panels for those signals, and `make platform-api-smoke API_BASE=<api-origin>` verifies that the metrics move after smoke activity.

## Next Iterations

- Add expert review workflows as an optional layer on top of deterministic rubric feedback.
- Move backend tests from direct `Base.metadata.create_all` fixtures to an Alembic-backed fixture once migration speed and isolation are acceptable.
- Add a split static public catalog if a read-only CloudFront/S3 surface becomes useful.
