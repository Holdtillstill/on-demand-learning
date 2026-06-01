# Build a platform career proof pack

Track: Career
Level: Advanced
Lab tier: full
Estimated time: 75 minutes

## Scenario

You need interview-ready proof that your platform skills are practical, current, and credible after a layoff.

## Guided run sequence

1. Prepare workspace
   - No external job board required; this lab includes sample job-skill demand and evidence files.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup build-platform-career-proof-pack
   - bash labs/platform-academy/build-platform-career-proof-pack/setup.sh --evidence /tmp/career-proof-evidence.md
2. Investigate safely
   - Extract repeated skills from the sample target roles.
   - Pick three lab artifacts and map them to proof bullets.
   - Fill the README template with commands, evidence, validation, rollback, and interview talking points.
   - Run the local career proof analyzer to prove the README, bullets, STAR stories, missing-proof list, and public-safety boundary.
3. Prove the finding
   - Target roles repeatedly mention Kubernetes, AWS, Terraform, CI/CD, observability, SRE, and security.
   - The evidence inventory names five candidate artifacts and missing proof to collect.
   - The README template forces problem, commands, validation, rollback, and STAR talking points.
   - The completed proof pack includes a README proof section, resume bullets, and STAR stories.
4. Reset or hand off
   - bash labs/platform-academy/build-platform-career-proof-pack/cleanup.sh
   - Use the included job skills and evidence inventory instead of external job postings.
   - Write one README proof section from any converted lab.

## Evidence artifact map

- `labs/platform-academy/build-platform-career-proof-pack/job-skills.txt` - Lab artifact
- `labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md` - Decision note
- `labs/platform-academy/build-platform-career-proof-pack/readme-template.md` - Decision note
- `labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md` - Target artifact
- `labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md` - Decision note
- `labs/platform-academy/build-platform-career-proof-pack/star-stories.md` - Decision note
- `labs/platform-academy/build-platform-career-proof-pack/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py` - Lab artifact
- `labs/platform-academy/build-platform-career-proof-pack/setup.sh` - Lab artifact
- `labs/platform-academy/build-platform-career-proof-pack/validate.sh` - Self-check script
- `labs/platform-academy/build-platform-career-proof-pack/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/build-platform-career-proof-pack/job-skills.txt
- labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md
- labs/platform-academy/build-platform-career-proof-pack/readme-template.md
- labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md
- labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md
- labs/platform-academy/build-platform-career-proof-pack/star-stories.md
- labs/platform-academy/build-platform-career-proof-pack/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py
- labs/platform-academy/build-platform-career-proof-pack/setup.sh
- labs/platform-academy/build-platform-career-proof-pack/validate.sh
- labs/platform-academy/build-platform-career-proof-pack/cleanup.sh

## Worksheet prompts

- [ ] Record the job-skill packet, evidence inventory, README template, and public-safe redaction boundary.
- [ ] Paste repeated target skills and the platform domains covered by the selected lab evidence.
- [ ] Paste selected lab artifacts, command/validator proof, decision evidence, rollback evidence, and missing proof.
- [ ] Write one portfolio proof section with problem, environment, commands, decision, validation, and talking points.
- [ ] Write resume bullets and STAR stories tied to incident response, security, cost, and release safety evidence.
- [ ] Capture analyzer output, validation output, and every claim that still needs screenshots, diagrams, or stronger evidence.

## Prerequisites

- [ ] No external job board required; this lab includes sample job-skill demand and evidence files.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup build-platform-career-proof-pack
- bash labs/platform-academy/build-platform-career-proof-pack/setup.sh --evidence /tmp/career-proof-evidence.md
- sed -n '1,160p' labs/platform-academy/build-platform-career-proof-pack/job-skills.txt
- sed -n '1,180p' labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace build-platform-career-proof-pack --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip build-platform-career-proof-pack-learner-workspace.zip
- cd build-platform-career-proof-pack
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Extract repeated skills from the sample target roles.
- [ ] Pick three lab artifacts and map them to proof bullets.
- [ ] Fill the README template with commands, evidence, validation, rollback, and interview talking points.
- [ ] Run the local career proof analyzer to prove the README, bullets, STAR stories, missing-proof list, and public-safety boundary.

## Runbook commands

- grep -n "Kubernetes\|Terraform\|incident response\|SLOs\|FinOps" labs/platform-academy/build-platform-career-proof-pack/job-skills.txt
- grep -n "Missing proof\|rollback\|STAR" labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md labs/platform-academy/build-platform-career-proof-pack/readme-template.md
- diff -u labs/platform-academy/build-platform-career-proof-pack/readme-template.md labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md || true
- python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md

## Expected evidence

- [ ] Target roles repeatedly mention Kubernetes, AWS, Terraform, CI/CD, observability, SRE, and security.
- [ ] The evidence inventory names five candidate artifacts and missing proof to collect.
- [ ] The README template forces problem, commands, validation, rollback, and STAR talking points.
- [ ] The completed proof pack includes a README proof section, resume bullets, and STAR stories.
- [ ] The local analyzer reports Career proof pack analysis passed.

## Validation commands

- bash labs/platform-academy/build-platform-career-proof-pack/validate.sh
- bash labs/platform-academy/build-platform-career-proof-pack/validate.sh --evidence /tmp/career-proof-evidence.md
- python3 labs/platform-academy/build-platform-career-proof-pack/career_proof_analyzer.py --skills labs/platform-academy/build-platform-career-proof-pack/job-skills.txt --inventory labs/platform-academy/build-platform-career-proof-pack/evidence-inventory.md --proof labs/platform-academy/build-platform-career-proof-pack/completed-proof-readme.md --bullets labs/platform-academy/build-platform-career-proof-pack/resume-bullets.md --star labs/platform-academy/build-platform-career-proof-pack/star-stories.md
- grep -n "Release Safety" labs/platform-academy/build-platform-career-proof-pack/star-stories.md

## Validation checks

- [ ] Public-safe redaction boundary recorded
- [ ] Repeated target skills captured
- [ ] Lab artifacts and validators mapped
- [ ] Portfolio proof README completed
- [ ] Resume bullets written with action/scope/impact
- [ ] STAR stories written for incident/security/cost/release
- [ ] Career proof analyzer output, validation output, and missing-proof evidence recorded

## Rubric

- [ ] Preserves the public-safe evidence boundary and avoids secrets, customer data, or private identifiers.
- [ ] Maps repeated target skills to concrete Platform Academy lab artifacts and domains.
- [ ] Cites commands, validators, decisions, rollback notes, and missing proof instead of broad claims.
- [ ] Completes a portfolio README proof section with problem, environment, command, decision, validation, and rollback.
- [ ] Writes resume bullets and STAR stories tied to incident response, security, cost, and release safety.
- [ ] Saves validation output and flags claims that need stronger screenshots, diagrams, or redaction.

## Cleanup commands

- bash labs/platform-academy/build-platform-career-proof-pack/cleanup.sh

## No-cluster fallback

- [ ] Use the included job skills and evidence inventory instead of external job postings.
- [ ] Write one README proof section from any converted lab.
