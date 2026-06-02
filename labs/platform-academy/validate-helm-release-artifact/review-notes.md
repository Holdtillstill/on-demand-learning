# Helm Artifact Review Notes

Review the rendered artifact as if it came from `helm template checkout charts/checkout -f values/prod.yaml`.

Findings to confirm:

- The Deployment selector changes from `app.kubernetes.io/name=checkout` to `app=checkout`; that is immutable for an existing Deployment.
- The image changes from a digest to the mutable `latest` tag.
- The security context changes to `privileged: true`.
- A `LoadBalancer` Service is introduced, which can create cloud cost and exposure.

Decision:

Block the release until selector compatibility, image immutability, security context, and Service exposure are reviewed.
