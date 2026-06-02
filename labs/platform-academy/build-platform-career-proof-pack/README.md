# Full Lab: Build a Platform Career Artifact Pack

## Goal

Convert platform labs into interview-ready evidence: one portfolio README section, resume bullets, and STAR stories tied to real platform skills.

## Time

60 to 75 minutes.

## Safety

This lab uses local text artifacts only. Do not include secrets, employer-private screenshots, customer data, or live production identifiers in a public portfolio.

## Starting State

Inspect the skill demand and evidence inventory:

```bash
bash labs/platform-academy/build-platform-career-proof-pack/setup.sh --evidence /tmp/career-proof-evidence.md
sed -n '1,220p' labs/platform-academy/build-platform-career-proof-pack/triage-notes.md
sed -n '1,160p' labs/platform-academy/build-platform-career-proof-pack/job-skills.txt
sed -n '1,200p' labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md
sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/readme-template.md
sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/evidence-template.md
```

Setup only stages the evidence note and prints investigation commands. It does not run the analyzer by default.

Compare the empty template with the completed artifact section:

```bash
diff -u labs/platform-academy/build-platform-career-proof-pack/readme-template.md labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md || true
```

## Investigation

Find:

- The triage False Leads that make a portfolio claim sound stronger than its evidence.
- Which platform skills repeat across target roles.
- Which labs demonstrate Kubernetes, Terraform, security, SRE, CI/CD, Docker, cost, and ownership judgment.
- Which evidence is missing before a portfolio claim would be credible.
- Which results can become resume bullets.
- Which incidents, tradeoffs, and influence moments can become STAR stories.
- Which claims still need screenshots, diagrams, validation output, or public-safe redaction.

Run the local career artifact analyzer after collecting the pack, or use setup with `--run-analyzer`:

```bash
python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py \
  --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt \
  --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md \
  --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md \
  --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md \
  --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md
```

## Remediation Target

Use `completed-proof-readme.md`, `resume-bullets.md`, and `star-stories.md` as the target pack. The goal is concrete evidence, not a generic resume rewrite.

## Validation

```bash
bash labs/platform-academy/build-platform-career-proof-pack/validate.sh
bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence /tmp/career-proof-evidence.md
python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py \
  --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt \
  --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md \
  --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md \
  --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md \
  --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md
```

## Success Criteria

- You map repeated job skills to lab artifacts.
- You rule out false confidence from lab lists, duty-only bullets, weak STAR stories, screenshots without context, and unredacted claims.
- You complete one artifact README with problem, environment, commands, decision, validation, rollback, and talking points.
- You write resume bullets with action, platform scope, and impact.
- You write STAR stories for incident response, security, cost, and release safety.
- Your evidence includes `Career artifact pack analysis passed`.
- You keep every public claim tied to artifact, command, validation, rollback, or redaction evidence.
