# Drift Ownership Decision

ArgoCD reports OutOfSync because `.spec.replicas` is `3` in Git and `9` in the live object.

Questions to answer:

- Is the HorizontalPodAutoscaler expected to own `spec.replicas`?
- Should Git pin replicas, or should ArgoCD ignore only this exact field?
- Is the live annotation safe controller metadata or unmanaged drift?

Recommended decision:

If autoscaling owns replicas, add a narrow `ignoreDifferences` rule for `spec.replicas` on the Deployment and keep the image, labels, resources, and security settings owned by Git.
