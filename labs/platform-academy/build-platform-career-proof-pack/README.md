# Full Lab: Build a Platform Career Proof Pack

## Goal

Convert platform labs into interview-ready evidence: one portfolio README section, resume bullets, and STAR stories tied to real platform skills.

## Time

60 to 75 minutes.

## Safety

This lab uses local text artifacts only. Do not include secrets, employer-private screenshots, customer data, or live production identifiers in a public portfolio.

## Starting State

Inspect the skill demand and evidence inventory:

```bash
sed -n '1,160p' labs/platform-academy/build-platform-career-proof-pack/job-skills.txt
sed -n '1,200p' labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md
sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/readme-template.md
sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/evidence-template.md
```

Compare the empty template with the completed proof section:

```bash
diff -u labs/platform-academy/build-platform-career-proof-pack/readme-template.md labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md || true
```

## Investigation

Find:

- Which platform skills repeat across target roles.
- Which labs prove Kubernetes, Terraform, security, SRE, CI/CD, Docker, cost, and ownership judgment.
- Which proof is missing before a portfolio claim would be credible.
- Which results can become resume bullets.
- Which incidents, tradeoffs, and influence moments can become STAR stories.
- Which claims still need screenshots, diagrams, validation output, or public-safe redaction.

## Remediation Target

Use `completed-proof-readme.md`, `resume-bullets.md`, and `star-stories.md` as the target pack. The goal is concrete evidence, not a generic resume rewrite.

## Validation

```bash
bash labs/platform-academy/build-platform-career-proof-pack/validate.sh
bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence /tmp/career-proof-evidence.md
```

## Success Criteria

- You map repeated job skills to lab artifacts.
- You complete one proof README with problem, environment, commands, decision, validation, rollback, and talking points.
- You write resume bullets with action, platform scope, and impact.
- You write STAR stories for incident response, security, cost, and release safety.
- You keep every public claim tied to artifact, command, validation, rollback, or redaction evidence.
