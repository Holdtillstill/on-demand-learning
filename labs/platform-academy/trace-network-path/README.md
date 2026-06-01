# Full Lab: Trace an HTTP Request Across the Network Path

## Goal

Walk an HTTP 503 from client symptom to the most likely Kubernetes configuration issue. The default lab uses captured DNS, ALB, Ingress, Service, and Pod evidence so it can be completed without AWS or cluster access. An optional disposable-cluster mode creates the broken Kubernetes objects locally.

## Time

40 to 55 minutes.

## Safety

No AWS or Kubernetes access is required for the default path. Use the captured DNS, ALB, Ingress, Service, and Pod evidence instead of changing a real traffic path. If you use `--cluster`, run it only against kind, minikube, Docker Desktop, Rancher Desktop, or another approved sandbox.

## Starting State

Open the evidence pack:

```bash
bash labs/platform-academy/trace-network-path/setup.sh --evidence /tmp/network-path-evidence.md
sed -n '1,220p' labs/platform-academy/trace-network-path/incident-handoff.md
sed -n '1,220p' labs/platform-academy/trace-network-path/network-evidence.md
sed -n '1,220p' labs/platform-academy/trace-network-path/ingress-service.yaml
sed -n '1,160p' labs/platform-academy/trace-network-path/evidence-template.md
```

Optional local broken-state setup:

```bash
bash labs/platform-academy/trace-network-path/setup.sh --cluster --evidence /tmp/network-path-evidence.md
```

## Investigation

Answer these before opening the solution:

- Which hop emits the 503?
- Does DNS resolve to the expected load balancer?
- What exact ALB target-health reason is reported?
- Does the Ingress route the expected host and path?
- Does the Service point at the right backend port name?
- Do the Pods expose a matching named port?
- Which owner should act if DNS and ALB routing are still pointed at the expected backend?
- Which owner should change the source manifest, and what validation output should be saved?

## Fix

Compare the broken and fixed manifests:

```bash
diff -u labs/platform-academy/trace-network-path/ingress-service.yaml labs/platform-academy/trace-network-path/fixed-ingress-service.yaml || true
```

## Validation

```bash
bash labs/platform-academy/trace-network-path/validate.sh
bash labs/platform-academy/trace-network-path/validate.sh --evidence /tmp/network-path-evidence.md
bash labs/platform-academy/trace-network-path/validate.sh --cluster
bash labs/platform-academy/trace-network-path/cleanup.sh
```

## Success Criteria

- You can identify the failing hop without guessing.
- You can explain why `targetPort` name matching matters.
- You preserve Ingress host/path behavior while fixing Service-to-Pod routing.
- You can save a hop-by-hop evidence note without live DNS, ALB, or cluster access.
