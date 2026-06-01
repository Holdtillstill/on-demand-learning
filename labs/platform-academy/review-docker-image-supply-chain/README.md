# Full Lab: Review a Docker Image Supply Chain

## Goal

Review a Dockerfile and captured image metadata before promoting an image to production. The starting artifact intentionally includes common supply-chain and runtime risks.

## Time

35 to 50 minutes.

## Safety

The default path does not require Docker. Use the supplied Dockerfile, `image-inspect.json`, and `history.txt` as captured evidence. Do not copy the unsafe secret pattern into a real image.

## Starting State

```bash
bash labs/platform-academy/review-docker-image-supply-chain/setup.sh --evidence /tmp/docker-supply-chain-evidence.md
sed -n '1,180p' labs/platform-academy/review-docker-image-supply-chain/Dockerfile
sed -n '1,180p' labs/platform-academy/review-docker-image-supply-chain/image-inspect.json
sed -n '1,120p' labs/platform-academy/review-docker-image-supply-chain/history.txt
```

Compare with the safer runtime target:

```bash
diff -u labs/platform-academy/review-docker-image-supply-chain/Dockerfile labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile || true
```

Run the local analyzer:

```bash
python3 labs/platform-academy/review-docker-image-supply-chain/supply_chain_analyzer.py \
  --dockerfile labs/platform-academy/review-docker-image-supply-chain/Dockerfile \
  --inspect labs/platform-academy/review-docker-image-supply-chain/image-inspect.json \
  --history labs/platform-academy/review-docker-image-supply-chain/history.txt \
  --hardened labs/platform-academy/review-docker-image-supply-chain/hardened.Dockerfile \
  --promotion labs/platform-academy/review-docker-image-supply-chain/promotion-note.md
```

## Investigation

Find:

- Whether the image is promoted by mutable tag or immutable digest.
- Whether a secret appears in Dockerfile, image config, or history.
- Whether the runtime image includes the source tree and build dependencies.
- Whether the container runs as root.
- Whether the image has SBOM and scan evidence before promotion.
- Which rollback artifact should be referenced in release notes.
- Whether the local analyzer supports a block-or-promote decision.

## Remediation Target

Use `hardened.Dockerfile` and `promotion-note.md` as the target review packet.

## Validation

```bash
bash labs/platform-academy/review-docker-image-supply-chain/validate.sh
bash labs/platform-academy/review-docker-image-supply-chain/validate.sh --evidence /tmp/docker-supply-chain-evidence.md
```

## Success Criteria

- You block the unsafe image from production promotion.
- You explain tag versus digest evidence.
- You identify secret leakage and root runtime risk.
- You use analyzer output as evidence for the promotion block.
- You propose a smaller non-root runtime image with scan, SBOM, digest, and rollback evidence.
- Your evidence note names tag/digest, secret locations, runtime user, copied build artifacts, SBOM/scan, rollback digest, owner, and promotion decision.
