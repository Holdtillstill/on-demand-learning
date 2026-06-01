# Advanced SRE Lab Promotion Plan

Status: staged drafts, not live catalog entries.

The draft topics in `docs/platform-academy-advanced-sre-curriculum-drafts.json` should not be added to the live Platform Academy catalog until each one has repository-backed lab artifacts, static API exports, and contract coverage. The current lab runner and smoke gates intentionally assume every `lab_tier: "full"` lab has runnable or file-only validation paths.

## Promotion Rules

Each promoted lab must include:

- A directory under `labs/platform-academy/<slug>/`.
- `README.md`, `solution.md`, `setup.sh`, `validate.sh`, `cleanup.sh`, `evidence-template.md`, and any analyzer/simulator files referenced by catalog metadata.
- At least four worksheet prompts, four rubric items, five validation checks, non-empty setup/practice/validation/cleanup/no-cluster metadata, and artifact paths that stay inside the lab directory or approved shared helpers.
- A local-safe no-cluster mode for AWS/EKS/Secrets/Service Mesh/Chaos topics unless a disposable local cluster path is explicitly supported.
- Runner support in `labs/platform-academy/run-lab.sh` only after the lab passes the contract verifier.
- Static API exports for packet/workspace bundles.
- Updated count docs and smoke expectations if the live lab count changes from 21.

## Recommended Promotion Order

1. `external-secrets-aws-secrets-manager`
   Highest value without needing a live AWS account if implemented as an artifact-review lab with mocked SecretStore, ExternalSecret, controller log, and IAM policy/trust analyzer.

2. `debug-statefulset-volume-attachment`
   Strong hands-on value. Implement as local files plus optional kind simulation because real EBS attach/detach requires cloud credentials.

3. `service-mesh-mtls-traffic-routing`
   Useful, but needs a careful local substitute. Prefer static Envoy/Istio/Linkerd artifacts and analyzer first, optional cluster mode later.

4. `chaos-load-node-termination-game-day`
   Highest operational value but riskiest. Keep as tabletop/k6 evidence review until a disposable cluster harness can prove cleanup and safety.

## Gate Sequence

Run these before adding a drafted lab to the live static catalog:

```bash
bash labs/platform-academy/run-lab.sh show <slug>
bash labs/platform-academy/run-lab.sh packet <slug> >/tmp/<slug>-packet.md
bash labs/platform-academy/run-lab.sh workspace <slug> --dir /tmp/platform-academy-workspaces --force
cd /tmp/platform-academy-workspaces/<slug>
./setup.sh
./validate.sh --files-only
./validate.sh
./cleanup.sh
cd -
bash labs/platform-academy/verify-full-labs.sh
python3 scripts/verify_platform_lab_contract.py
python3 scripts/verify_platform_content_counts.py
cd apps/platform-academy && npm run smoke:routes
```

Cluster-backed paths must also pass the cluster-specific gates on a disposable context:

```bash
bash labs/platform-academy/bootstrap-local-cluster.sh --preflight <slug>
bash labs/platform-academy/run-lab.sh setup <slug> --preflight
bash labs/platform-academy/run-lab.sh setup <slug> --cluster
bash labs/platform-academy/run-lab.sh validate <slug> --cluster
bash labs/platform-academy/run-lab.sh cleanup <slug>
```
