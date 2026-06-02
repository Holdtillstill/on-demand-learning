# Review a Docker image supply chain

Track: Docker
Level: Fresher / Beginner
Lab tier: full
Estimated time: 45 minutes

## Scenario

A team wants to promote an image tagged `latest` to production, and you need to prove which artifact will actually run.

## Guided run sequence

1. Prepare workspace
   - No Docker daemon required for the baseline path; this lab uses local Dockerfile and captured metadata.
   - Run commands from the repository root.
   - bash labs/platform-academy/run-lab.sh setup review-docker-image-supply-chain
   - bash labs/platform-academy/review-docker-image-supply-chain/setup.sh --evidence /tmp/docker-supply-chain-evidence.md
2. Investigate safely
   - Read the triage notes and rule out false promotion signals before reviewing the image.
   - Identify base image, runtime user, copied files, exposed ports, and entrypoint.
   - Compare tag evidence with digest evidence.
   - Use the local analyzer to convert supply-chain findings into a block-or-promote decision.
3. Prove the finding
   - The triage notes rule out latest-tag freshness, deleted-secret-layer confidence, runtime-only non-root controls, post-promotion scans, and rollback tags without digest.
   - The image uses the mutable latest tag and has no RepoDigests.
   - No runtime user is configured.
   - API_TOKEN appears in Dockerfile, inspect metadata, and history.
4. Reset or hand off
   - bash labs/platform-academy/review-docker-image-supply-chain/cleanup.sh
   - Use triage-notes.md, Dockerfile, inspect JSON, and history text instead of building an image.
   - Write a promotion note naming digest, SBOM, scan, runtime user, and rollback requirements.

## Evidence artifact map

- `labs/platform-academy/review-docker-image-supply-chain/triage-notes.md` - Decision note
- `labs/platform-academy/review-docker-image-supply-chain/Dockerfile` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/image-inspect.json` - Manifest
- `labs/platform-academy/review-docker-image-supply-chain/history.txt` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/promotion-note.md` - Decision note
- `labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/setup.sh` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/evidence-template.md` - Evidence template
- `labs/platform-academy/lib/evidence-check.sh` - Lab artifact
- `labs/platform-academy/review-docker-image-supply-chain/validate.sh` - Self-check script
- `labs/platform-academy/review-docker-image-supply-chain/cleanup.sh` - Cleanup script

## Learner artifact paths

- labs/platform-academy/review-docker-image-supply-chain/triage-notes.md
- labs/platform-academy/review-docker-image-supply-chain/Dockerfile
- labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile
- labs/platform-academy/review-docker-image-supply-chain/image-inspect.json
- labs/platform-academy/review-docker-image-supply-chain/history.txt
- labs/platform-academy/review-docker-image-supply-chain/promotion-note.md
- labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py
- labs/platform-academy/review-docker-image-supply-chain/setup.sh
- labs/platform-academy/review-docker-image-supply-chain/evidence-template.md
- labs/platform-academy/lib/evidence-check.sh
- labs/platform-academy/review-docker-image-supply-chain/validate.sh
- labs/platform-academy/review-docker-image-supply-chain/cleanup.sh

## Worksheet prompts

- [ ] Record the Dockerfile, captured inspect/history files, reviewer, and confirmation that the unsafe secret pattern will not be reused.
- [ ] Read triage-notes.md and list the False Leads ruled out before approving image promotion.
- [ ] Paste `checkout:latest`, digest, promotion artifact, and rollback artifact evidence.
- [ ] Paste every place `API_TOKEN` appears and the blank runtime user evidence.
- [ ] Paste the runtime image bloat evidence, including copied source/build files and base image risk.
- [ ] Write the hardening decision with required Dockerfile, SBOM, scan, non-root, and owner actions.
- [ ] Capture promotion note, validation output, digest/rollback requirements, and evidence to save.

## Prerequisites

- [ ] No Docker daemon required for the baseline path; this lab uses local Dockerfile and captured metadata.
- [ ] Run commands from the repository root.

## Setup commands

- bash labs/platform-academy/run-lab.sh setup review-docker-image-supply-chain
- bash labs/platform-academy/review-docker-image-supply-chain/setup.sh --evidence /tmp/docker-supply-chain-evidence.md
- sed -n '1,220p' labs/platform-academy/review-docker-image-supply-chain/triage-notes.md
- sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/Dockerfile
- sed -n '1,160p' labs/platform-academy/review-docker-image-supply-chain/history.txt

## Setup self-checks

- Default setup stages evidence and intentionally skips analyzer or simulator output.
- After inspecting the broken state, run analyzer self-check: `bash labs/platform-academy/run-lab.sh setup review-docker-image-supply-chain --run-analyzer`.

## Local workspace

- bash labs/platform-academy/run-lab.sh workspace review-docker-image-supply-chain --dir /tmp/platform-academy-workspaces

## Downloaded workspace quickstart

- unzip review-docker-image-supply-chain-learner-workspace.zip
- cd review-docker-image-supply-chain
- ./setup.sh
- # Fill evidence.md with your investigation notes
- ./validate.sh --files-only
- ./validate.sh
- ./cleanup.sh

## Practice steps

- [ ] Read the triage notes and rule out false promotion signals before reviewing the image.
- [ ] Identify base image, runtime user, copied files, exposed ports, and entrypoint.
- [ ] Compare tag evidence with digest evidence.
- [ ] Use the local analyzer to convert supply-chain findings into a block-or-promote decision.
- [ ] Flag secret leakage and oversized runtime image risk.

## Runbook commands

- grep -n "False Leads\|latest\|secret\|rollback digest" labs/platform-academy/review-docker-image-supply-chain/triage-notes.md
- grep -n "FROM\|COPY\|API_TOKEN\|USER" labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/image-inspect.json
- grep -n "latest\|RepoDigests\|secret\|COPY" labs/platform-academy/review-docker-image-supply-chain/image-inspect.json labs/platform-academy/review-docker-image-supply-chain/history.txt
- diff -u labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile || true

## Expected evidence

- [ ] The triage notes rule out latest-tag freshness, deleted-secret-layer confidence, runtime-only non-root controls, post-promotion scans, and rollback tags without digest.
- [ ] The image uses the mutable latest tag and has no RepoDigests.
- [ ] No runtime user is configured.
- [ ] API_TOKEN appears in Dockerfile, inspect metadata, and history.
- [ ] The local analyzer reports Docker supply-chain analysis passed.
- [ ] The promotion note requires digest, SBOM, scan, non-root runtime, and rollback evidence.

## Validation commands

- bash labs/platform-academy/review-docker-image-supply-chain/validate.sh
- bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence /tmp/docker-supply-chain-evidence.md
- python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py --dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile --inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json --history labs/platform-academy/review-docker-image-supply-chain/history.txt --hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile --promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md
- grep -n "Immutable image digest" labs/platform-academy/review-docker-image-supply-chain/promotion-note.md

## Validation checks

- [ ] Captured-evidence safety boundary recorded
- [ ] Triage False Leads ruled out
- [ ] Docker supply-chain analysis passed output captured
- [ ] Tag and missing digest evidence captured
- [ ] Secret leakage evidence captured
- [ ] Blank runtime user and image bloat evidence captured
- [ ] Hardening decision and owner actions written
- [ ] Promotion/rollback evidence requirements recorded
- [ ] Validation output and saved evidence recorded

## Rubric

- [ ] Preserves the captured-evidence safety boundary and avoids reusing the secret pattern.
- [ ] Uses triage notes to rule out latest freshness, deleted secret layers, runtime-only non-root controls, post-promotion scans, and rollback tag False Leads.
- [ ] Captures `checkout:latest` tag-only promotion, missing RepoDigests, and rollback artifact gaps.
- [ ] Finds secret leakage in Dockerfile, inspect metadata, and layer history plus blank runtime user.
- [ ] Explains runtime bloat and root-runtime risk with source/build-copy evidence.
- [ ] Blocks promotion with required digest, SBOM, scan, non-root runtime, and owner actions.
- [ ] Saves promotion note, validation output, digest, rollback, and cleanup/no-runtime evidence.

## Cleanup commands

- bash labs/platform-academy/review-docker-image-supply-chain/cleanup.sh

## No-cluster fallback

- [ ] Use triage-notes.md, Dockerfile, inspect JSON, and history text instead of building an image.
- [ ] Write a promotion note naming digest, SBOM, scan, runtime user, and rollback requirements.
