# Full Lab: Design a Safe Kubernetes Release Pipeline

## Goal

Review a release pipeline that can deploy directly to production, then replace it with a safer pipeline contract for Kubernetes delivery.

## Time

45 to 60 minutes.

## Safety

This lab is file-first. Do not run these GitHub Actions steps against a real registry, cluster, or AWS account. Treat the workflow files as release-design artifacts.

## Starting State

Inspect the unsafe pipeline:

```bash
sed -n '1,220p' labs/platform-academy/design-safe-release-pipeline/pipeline.yaml
sed -n '1,220p' labs/platform-academy/design-safe-release-pipeline/release-checklist.md
sed -n '1,180p' labs/platform-academy/design-safe-release-pipeline/evidence-template.md
```

Compare it with the safer target:

```bash
diff -u labs/platform-academy/design-safe-release-pipeline/pipeline.yaml labs/platform-academy/design-safe-release-pipeline/safe-pipeline.yaml || true
```

## Investigation

Find:

- Whether production deploys directly from `main`.
- Whether the image is promoted by immutable digest.
- Whether scan, SBOM, manifest render, schema, and policy gates exist before deployment.
- Whether staging and smoke tests prove the artifact before production.
- Whether production deployment has approval, canary, SLO, and rollback checks.
- Whether production permissions are restricted.
- Which artifacts prove the exact promoted image, rendered manifests, and rollback point.

## Remediation Target

Use `safe-pipeline.yaml` as the review target. It is not tied to a real CI runner; it names the gates, artifacts, and handoff points a platform team should require before production.

## Validation

```bash
bash labs/platform-academy/design-safe-release-pipeline/validate.sh
bash labs/platform-academy/design-safe-release-pipeline/validate.sh --evidence /tmp/release-pipeline-evidence.md
```

## Success Criteria

- You block the unsafe direct-to-production pipeline.
- You explain why tag-only promotion is weaker than digest promotion.
- You name the minimum pre-deploy gates and post-deploy checks.
- You can defend the production approval, canary, and rollback boundary.
- You can save a release-review evidence packet without touching a real CI runner.
