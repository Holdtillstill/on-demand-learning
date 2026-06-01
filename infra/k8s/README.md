# Kubernetes Manifests

These manifests are credible deployment scaffolding for local clusters or interview review. They intentionally use placeholder images and demo settings.

Production expectations:
- Replace the demo PostgreSQL manifest with managed RDS PostgreSQL.
- Replace in-cluster Redis with managed ElastiCache or a hardened Redis operator deployment.
- Configure a real ingress controller, TLS, external secrets, image tags, and environment-specific overlays.
- Review resource requests, HPA thresholds, network policies, and PodDisruptionBudgets against real traffic.

Example local validation:

```bash
kubectl apply --dry-run=client -f infra/k8s/platform-academy.yaml
```
