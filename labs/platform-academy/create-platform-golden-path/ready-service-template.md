# Ready Service Golden Path Template

## Required Inputs

- `service_name`: DNS-safe service id.
- `owner_team`: team slug that owns code, runtime, cost, and incidents.
- `runtime`: supported runtime such as node, python, go, or java.
- `port`: application listen port.
- `data_classification`: public, internal, confidential, or restricted.
- `pager_rotation`: escalation target for production incidents.
- `cost_center`: FinOps owner for cloud and Kubernetes spend.
- `slo_target`: initial availability or latency objective.

## Generated Artifacts

- Dockerfile with non-root runtime, small production image, no committed secrets, and explicit start command.
- Helm chart with resources, probes, Pod security context, Service, and optional Ingress values.
- CI workflow with build, test, image scan, SBOM, manifest render, policy check, staging deploy, smoke test, and production approval.
- ArgoCD Applications for dev, staging, and production.
- Service SLO dashboard and alert rule skeleton.
- Runbook with symptoms, dashboards, rollback, owners, and escalation.
- Backstage `catalog-info.yaml` with owner, lifecycle, system, pager, dashboard, repository, and cost annotations.

## Secure Defaults

- Run as non-root.
- Read-only root filesystem unless a write path is explicitly requested.
- Resource requests are required before production.
- Secrets are referenced through the platform secret path, never generated into source.
- Production deploys require staging smoke evidence and approval.
- Rollback command and SLO rollback condition are generated with the service.

## First-Run Developer Experience

1. Fill in the service questionnaire.
2. Generate the repository and open a pull request.
3. CI renders the Helm chart, scans the image, emits an SBOM, and posts policy findings.
4. The dev ArgoCD app syncs automatically.
5. The service owner opens the generated dashboard and runbook.
6. Staging smoke tests pass.
7. Production readiness review confirms owner, SLO, alerts, rollback, runbook, and cost center.

## Adoption Metrics

- Time from questionnaire to first dev deploy.
- Percentage of generated services with owner, pager, dashboard, and runbook filled.
- Production readiness review pass rate.
- Number of template escape hatches requested per quarter.
- Incident count for golden-path services versus manually scaffolded services.
