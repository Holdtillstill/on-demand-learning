# Interview Demo Walkthrough

Use this flow to show both product depth and platform maturity without deploying anything.

## 1. Start the Local Platform

```bash
docker compose up -d --build api frontend worker prometheus grafana jaeger
```

Open:

- Frontend: http://localhost:8080
- API docs: http://localhost:8000/docs
- Grafana: http://localhost:3001
- Jaeger: http://localhost:16686

## 2. Show Product Depth

1. Open **Dashboard** and point out XP, daily goal, streak, achievements, and due reviews for `demo-user`.
2. Open **Learning Path** and show completed, recommended, and locked lesson states across Mandarin, characters, poetry, art, and culture.
3. Open **Platform Academy** and show the Kubernetes/EKS/Helm/ArgoCD/SRE roadmap, track progress, and practical labs.
4. Open a Platform Academy lesson and show the production teaching body, key terms, review prompts, lab checklist, and **Mark complete** progress hook.
5. Open **Characters** and switch simplified/traditional forms while explaining radicals, stroke counts, mnemonics, and cultural notes.
6. Open **Reviews**, reveal a due card, and submit **Know it** to update SRS scheduling, quiz telemetry, and XP.
7. Open a Tang poetry or Song painting course to show seeded cultural content with pinyin and vocabulary.
8. Open **Admin Upload**, choose a template, inspect the preview counts, and submit. Re-submit to show duplicate-slug handling.

## 3. Generate Operational Signals

```bash
bash scripts/generate_learner_activity.sh
```

Then show:

- `/metrics` includes request, learning event, XP, achievement, SRS, and DB health metrics.
- Grafana panels move for learning events, XP awarded, SRS reviews, due cards, request rate, and p95 latency.
- Jaeger shows API and worker traces after activity and worker refresh jobs.

## 4. Explain Platform Guardrails

- Docker Compose keeps the full stack reproducible without cloud resources.
- Platform Academy teaches EKS, IRSA, Karpenter, Helm, ArgoCD, and SRE patterns without deploying to AWS or requiring credentials.
- Kubernetes manifests include probes, HPAs, PDBs, service accounts, and network policy.
- Terraform is scaffold-only and validated, not applied.
- CI validates backend, frontend, Docker builds, security scan, Compose config, Terraform, and Kubernetes dry-run.
- Runbooks cover readiness, high error rate, high latency, worker failures, search failures, Prometheus targets, and duplicate slugs.

## 5. Close With Limitations

- Auth is represented by `demo-user`.
- Payments and subscriptions are mocked.
- SRS uses a simple local scheduling algorithm, not a full SM-2 implementation.
- Stroke-order practice stores metadata and mnemonics but does not grade handwriting.
