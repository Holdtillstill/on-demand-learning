# Demo Walkthrough

Use this flow to show both product depth and platform maturity without deploying anything.

## 1. Start the Local Platform

```bash
docker compose up -d --build api platform-academy worker prometheus grafana jaeger
```

Open:

- Platform Academy frontend: http://localhost:8090
- API docs: http://localhost:8000/docs
- Grafana: http://localhost:3001
- Jaeger: http://localhost:16686

## 2. Show Product Depth

1. Open **Dashboard** and point out XP, daily goal, streak, achievements, due reviews, and the browser-local guest profile.
2. Open **Learning Path** and show completed, recommended, and locked lesson states across the Platform Academy sequence.
3. Show Platform Academy filtering by level/topic, then open the roadmap to explain the recommended order from Kubernetes basics to production SRE.
4. Open a Platform Academy course and lesson to show teaching content, commands, production tradeoffs, key terms, review flashcards, lab scenario, and **Mark complete** progress hook.
5. Open **Labs** in Platform Academy and show local-safe drills for CrashLoopBackOff/ImagePullBackOff, EKS IP exhaustion, Helm validation, ArgoCD drift, security boundaries, and SLO runbooks.
6. Open **Resources** and **Interview Prep** to show portfolio artifacts, official-source links, question packs, and downloadable cram sheets.

## 3. Generate Operational Signals

```bash
bash scripts/generate_learner_activity.sh
```

Then show:

- `/metrics` includes request, learning event, XP, achievement, SRS, Platform Academy product, and DB health metrics.
- Grafana panels move for learning events, XP awarded, SRS reviews, due cards, Platform Academy activity saves, lab submissions, packet and bundle downloads, dashboard reads, request rate, and p95 latency.
- Jaeger shows API and worker traces after activity and worker refresh jobs.

## 4. Explain Platform Guardrails

- Docker Compose keeps the full stack reproducible without cloud resources.
- Platform Academy is the only product frontend service and teaches EKS, IRSA, Karpenter, Helm, ArgoCD, security, and SRE patterns without deploying to AWS or requiring credentials.
- Kubernetes manifests include probes, HPAs, PDBs, service accounts, and network policy.
- Terraform is scaffold-only and validated, not applied.
- CI validates backend, frontend, Docker builds, security scan, Compose config, Terraform, and Kubernetes dry-run.
- Runbooks cover readiness, high error rate, high latency, worker failures, search failures, Prometheus targets, and duplicate slugs.

## 5. Close With Limitations

- Auth is represented by browser-local guest profiles and demo API users.
- Payments and subscriptions are mocked.
- SRS uses a simple local scheduling algorithm, not a full SM-2 implementation.
