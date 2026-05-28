# Platform Academy

Platform Academy is the second learning domain inside Zhongwen Cloud. It uses the existing course, lesson, flashcard, progress, XP, and dashboard machinery to teach production Kubernetes platform engineering without requiring AWS credentials or a real cluster.

## Local Use

Start the app locally:

```bash
docker compose up --build
```

Open:

- Frontend: http://localhost:8080/platform-academy
- Catalog API: http://localhost:8000/api/platform-academy/catalog
- Roadmap API: http://localhost:8000/api/platform-academy/roadmap
- Labs API: http://localhost:8000/api/platform-academy/labs

The academy is local-first. Do not run `terraform apply`, do not deploy to AWS, and do not add real credentials. Commands in lessons are teaching drills and inspection patterns.

## Curriculum

The seeded MVP contains five production-oriented tracks:

- Kubernetes Foundations for Platform Engineers: control loops, Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, probes, resource requests, CrashLoopBackOff, and rollout inspection.
- EKS Production Blueprint: VPC CNI behavior, subnet/IP planning, private endpoint tradeoffs, IAM/OIDC/IRSA, service account boundaries, managed node groups, Karpenter, add-ons, and cost guardrails.
- Helm in Production: chart API design, values layering, helpers, rendered diffs, immutable selectors, CRDs, hooks, rollback limits, chart testing, and supply chain checks.
- GitOps with ArgoCD: app-of-apps, AppProjects, sync waves, health, pruning, self-heal, drift, secrets, promotion, and rollback through Git.
- Observability and SRE for Kubernetes: RED/USE metrics, dashboards, SLOs, error budgets, alert fatigue, logs, traces, and incident runbooks.

Each lesson includes:

- A concrete teaching body with production tradeoffs.
- Key terms stored as lesson vocabulary.
- Flashcard-style review prompts.
- A practical lab scenario with commands and checklists.
- Progress completion through the existing `/api/progress` endpoint, which awards lesson XP.

## Labs

The first lab set is intentionally safe and local-readable:

- Debug CrashLoopBackOff without guessing.
- Design an EKS workload identity boundary.
- Validate a Helm chart like a release artifact.
- Trace an ArgoCD drift report.
- Write an SLO-backed Kubernetes runbook.

The labs can be demonstrated from the frontend or fetched from `/api/platform-academy/labs`. They are written as realistic production exercises, but they do not mutate cloud infrastructure.

## Portfolio Story

This feature shows that the product can support multiple learning domains while reusing shared platform capabilities:

- One SQLAlchemy model supports Mandarin lessons and platform-engineering lessons.
- Domain filtering keeps the original Zhongwen catalog and learning path separate from Platform Academy.
- Dedicated academy APIs expose a catalog, roadmap, and labs for a polished product surface.
- The frontend demonstrates a marketable senior DevOps learning product with real progress hooks.
- The operating model remains local-first with Docker Compose, tests, metrics, docs, and safe infra scaffolding.

## Next Iterations

- Add an in-browser lab worksheet with answer capture and rubric feedback.
- Add downloadable manifests for kind-based labs.
- Add platform-specific achievements such as `cluster_debugger` and `gitops_operator`.
- Add search facets by role, difficulty, and tool.
- Add a mock incident simulator that emits local metrics and logs for observability labs.
