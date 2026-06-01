# Full Lab: Create a Service Golden Path

## Goal

Review a platform service template as a product contract, then define the minimum ready-to-launch golden path for a new Kubernetes service.

## Time

45 to 60 minutes.

## Safety

This lab is file-first. It does not require Backstage, Cookiecutter, Terraform, Helm, ArgoCD, or a cluster. Treat the files as a platform product review packet.

## Starting State

Inspect the starting template and catalog metadata:

```bash
bash labs/platform-academy/create-platform-golden-path/setup.sh --evidence /tmp/golden-path-evidence.md
sed -n '1,220p' labs/platform-academy/create-platform-golden-path/service-template.md
sed -n '1,160p' labs/platform-academy/create-platform-golden-path/catalog-info.yaml
sed -n '1,180p' labs/platform-academy/create-platform-golden-path/evidence-template.md
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer by default.

Compare the starting metadata with the safer target:

```bash
diff -u labs/platform-academy/create-platform-golden-path/catalog-info.yaml labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml || true
```

Run the local analyzer after you inspect the template packet, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/create-platform-golden-path/golden_path_analyzer.py \
  --start-template labs/platform-academy/create-platform-golden-path/service-template.md \
  --ready-template labs/platform-academy/create-platform-golden-path/ready-service-template.md \
  --catalog labs/platform-academy/create-platform-golden-path/catalog-info.yaml \
  --fixed-catalog labs/platform-academy/create-platform-golden-path/fixed-catalog-info.yaml \
  --decision labs/platform-academy/create-platform-golden-path/decision-record.md
```

## Investigation

Find:

- Which service inputs are required before generation.
- Which generated artifacts are expected.
- Whether ownership, SLO dashboard, pager rotation, runbook, and cost center are present.
- Whether the template defines secure runtime defaults.
- Whether first-run developer experience has observable success criteria.
- Which adoption and reliability metrics the platform team should review after launch.
- Which metadata gaps should block onboarding before a service team depends on the template.
- Whether the local analyzer proves the starting gap, ready contract, fixed metadata, and block decision.

## Remediation Target

Use `ready-service-template.md` and `fixed-catalog-info.yaml` as the ready target. The goal is not to create a large framework; it is to make the contract specific enough that a service team can launch safely without a ticket-by-ticket handoff.

## Validation

```bash
bash labs/platform-academy/create-platform-golden-path/validate.sh
bash labs/platform-academy/create-platform-golden-path/validate.sh --evidence /tmp/golden-path-evidence.md
```

## Success Criteria

- You block the starting catalog metadata until missing ownership and observability fields are filled.
- You define required inputs, generated artifacts, secure defaults, and launch gates.
- You explain the first-run developer experience from questionnaire to production readiness review.
- You name the metrics that prove whether the golden path is actually useful.
- You use analyzer output as evidence for the product-readiness decision.
- You save a product-decision evidence packet with ownership and adoption metrics.
