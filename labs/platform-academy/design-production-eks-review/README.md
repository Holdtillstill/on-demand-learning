# Full Lab: Run a Production EKS Architecture Review

## Goal

Review a proposed production EKS design and identify launch blockers before traffic depends on the cluster.

## Time

50 to 70 minutes.

## Safety

No AWS credentials are required. This lab reviews captured architecture evidence only. Do not create or modify a real EKS cluster from this exercise.

## Starting State

```bash
bash labs/platform-academy/design-production-eks-review/setup.sh --evidence /tmp/production-eks-review-evidence.md
sed -n '1,220p' labs/platform-academy/design-production-eks-review/cluster-review.md
sed -n '1,220p' labs/platform-academy/design-production-eks-review/launch-review.md
sed -n '1,180p' labs/platform-academy/design-production-eks-review/evidence-template.md
```

## Investigation

Find:

- Public and private endpoint exposure.
- Critical workload spread and PDB coverage.
- Zonal storage and restore expectations.
- Missing cost labels.
- NAT, LoadBalancer, and idle request review gaps.
- Upgrade pause points for deprecated APIs, add-ons, and PDBs.
- The launch blockers, follow-up improvements, owners, and validation criteria.

Run the local review analyzer after you capture the evidence:

```bash
python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py \
  --review labs/platform-academy/design-production-eks-review/cluster-review.md \
  --launch labs/platform-academy/design-production-eks-review/launch-review.md
```

## Remediation Target

Use `launch-review.md`, the local analyzer output, and `solution.md` as the review answer. The target is a launch decision with blockers, owners, and validation criteria.

## Validation

```bash
bash labs/platform-academy/design-production-eks-review/validate.sh
bash labs/platform-academy/design-production-eks-review/validate.sh --evidence /tmp/production-eks-review-evidence.md
python3 labs/platform-academy/design-production-eks-review/production_review_analyzer.py \
  --review labs/platform-academy/design-production-eks-review/cluster-review.md \
  --launch labs/platform-academy/design-production-eks-review/launch-review.md
```

## Success Criteria

- You block launch until missing PDB, cost labels, upgrade matrix, and recovery proof are owned.
- You separate immediate launch blockers from follow-up improvements.
- You name which team owns workload, platform, data, and cost actions.
- Your evidence includes `Production EKS review analysis passed`.
- You produce a no-AWS launch decision packet that can survive review.
