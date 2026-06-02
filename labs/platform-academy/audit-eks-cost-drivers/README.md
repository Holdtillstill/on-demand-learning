# Full Lab: Audit EKS Cost Drivers

## Goal

Review EKS cost evidence and produce a recommendation table with owner, expected savings, reliability risk, and rollback.

## Time

45 to 60 minutes.

## Safety

No AWS Cost Explorer access is required. Use the local CSV and text snapshots. Do not delete real load balancers, PVCs, or workloads from this lab.

## Starting State

```bash
bash labs/platform-academy/audit-eks-cost-drivers/setup.sh --evidence /tmp/eks-cost-evidence.md
sed -n '1,220p' labs/platform-academy/audit-eks-cost-drivers/triage-notes.md
sed -n '1,160p' labs/platform-academy/audit-eks-cost-drivers/usage.csv
sed -n '1,120p' labs/platform-academy/audit-eks-cost-drivers/services.txt
sed -n '1,120p' labs/platform-academy/audit-eks-cost-drivers/storage.txt
sed -n '1,180p' labs/platform-academy/audit-eks-cost-drivers/evidence-template.md
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer by default. Run the local analyzer after you inspect the cost packet, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/audit-eks-cost-drivers/cost_analyzer.py \
  --usage labs/platform-academy/audit-eks-cost-drivers/usage.csv \
  --services labs/platform-academy/audit-eks-cost-drivers/services.txt \
  --storage labs/platform-academy/audit-eks-cost-drivers/storage.txt \
  --recommendations labs/platform-academy/audit-eks-cost-drivers/recommendations.md
```

## Investigation

Find:

- The triage False Leads that turn cost review into unsafe deletion.
- Workloads whose requests are much higher than usage.
- Unknown owners.
- Abandoned LoadBalancer Services.
- Abandoned or outdated storage.
- Whether the local analyzer separates quick wins from architecture-review items.
- Recommendations that are quick wins versus architecture changes.
- Owner, expected savings, reliability risk, rollback, and review cadence evidence for each recommendation.

## Remediation Target

Use `recommendations.md` and `solution.md` as the target answer.

## Validation

```bash
bash labs/platform-academy/audit-eks-cost-drivers/validate.sh
bash labs/platform-academy/audit-eks-cost-drivers/validate.sh --evidence /tmp/eks-cost-evidence.md
```

## Success Criteria

- You rank compute, LoadBalancer, and storage waste.
- You rule out false confidence from low utilization, unknown owner, resource age, and savings without rollback.
- You use analyzer output to support the ranking and owner split.
- You attach owner, expected savings, reliability risk, and rollback to each recommendation.
- You avoid deleting anything without ownership confirmation.
- You separate quick wins from architecture review items before proposing deletion or right-sizing.
