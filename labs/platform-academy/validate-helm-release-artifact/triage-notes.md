# Triage Notes: Rendered Helm Release Review

## Evidence Source

These notes are a captured release review handoff for the Helm artifact validation lab. Use them with the rendered before/after files, `review-notes.md`, and `safe-rendered-after.yaml` when Helm or a cluster is unavailable.

## Timeline

- 13:40 UTC: Chart render completed for the checkout release candidate.
- 13:44 UTC: Rendered diff showed the Deployment selector changed from `app.kubernetes.io/name=checkout` to `app=checkout`.
- 13:47 UTC: Image review found the release switched from a digest-pinned artifact to `checkout:latest`.
- 13:50 UTC: Runtime review found `privileged: true`.
- 13:53 UTC: Service review found a new `LoadBalancer` exposure.

## False Leads Ruled Out

- A successful Helm render is not release approval; rendered YAML can still be unsafe.
- `helm diff` being readable is not enough; immutable selector changes must be blocked before apply.
- A mutable `latest` tag is not an acceptable promotion substitute for a digest.
- Rolling back after applying an immutable selector change may require replacement, so "apply then fix" is not safe.
- A new `LoadBalancer` needs explicit exposure approval instead of being treated as a chart default.

## Strongest Clues

- The after render changes the Deployment selector.
- The image loses digest pinning.
- The runtime becomes privileged.
- The Service becomes externally exposed.
- The safe render preserves selector, digest promotion, non-privileged runtime, and ClusterIP exposure.

## Evidence To Save

- Before/after rendered diff.
- Immutable selector evidence.
- Image promotion evidence.
- Runtime and Service exposure evidence.
- Block decision, owner questions, analyzer result, safer render, and rollback note.
