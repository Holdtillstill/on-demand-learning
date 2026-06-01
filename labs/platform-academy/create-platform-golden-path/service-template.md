# Service Golden Path Template

Inputs:

- service_name
- owner_team
- runtime
- port
- data_classification
- pager_rotation
- cost_center

Generated artifacts:

- Dockerfile
- Helm chart with probes, resources, security context, and Service
- CI workflow with build, test, scan, render, and deploy stages
- ArgoCD Application for dev and prod
- Service SLO dashboard
- Runbook
- Backstage catalog-info.yaml

First-run developer experience:

1. Fill in the service questionnaire.
2. Generate the repository.
3. Push the first commit.
4. Open the generated dashboard and runbook.
5. Request production readiness review only after smoke tests pass.
