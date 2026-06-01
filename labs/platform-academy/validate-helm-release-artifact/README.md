# Full Lab: Validate a Helm Release Artifact

## Goal

Review rendered Kubernetes YAML as the release artifact, not just the Helm chart command result. The exercise simulates a release that renders successfully but introduces rollout, security, and exposure risk.

## Time

40 to 60 minutes.

## Safety

This lab is file-first and does not require Helm or a cluster. Do not apply the unsafe rendered artifact to a shared environment.

## Starting State

```bash
bash labs/platform-academy/validate-helm-release-artifact/setup.sh --evidence /tmp/helm-release-evidence.md
sed -n '1,220p' labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml
sed -n '1,260p' labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml
```

Compare the release delta:

```bash
diff -u labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml || true
```

Run the local analyzer:

```bash
python3 labs/platform-academy/validate-helm-release-artifact/helm_release_analyzer.py \
  --before labs/platform-academy/validate-helm-release-artifact/rendered-before.yaml \
  --after labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml \
  --safe labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml \
  --notes labs/platform-academy/validate-helm-release-artifact/review-notes.md
```

## Investigation

Find:

- Any immutable selector change.
- Any change from digest-pinned image to mutable tag.
- Any new privileged container setting.
- Any new externally exposed Service.
- Whether rollback would be simple or risky after this apply.
- Whether the local analyzer supports a block decision before cluster mutation.

## Remediation Target

Compare the unsafe render with the proposed safe render:

```bash
diff -u labs/platform-academy/validate-helm-release-artifact/rendered-after.yaml labs/platform-academy/validate-helm-release-artifact/safe-rendered-after.yaml || true
```

## Validation

```bash
bash labs/platform-academy/validate-helm-release-artifact/validate.sh
bash labs/platform-academy/validate-helm-release-artifact/validate.sh --evidence /tmp/helm-release-evidence.md
```

## Success Criteria

- You block the unsafe release before cluster mutation.
- You explain the selector immutability problem in plain language.
- You identify the image, security, and exposure regressions.
- You can name the safer rendered target.
- You use analyzer output as evidence for the release decision.
- Your evidence note names selector, image, security context, Service exposure, rollback risk, decision, owner, and safer render validation.
