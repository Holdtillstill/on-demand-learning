# Incident Handoff: Checkout 503 On Health Path

## Pager Snapshot

- Time window: 2026-05-30 14:05-14:22 UTC.
- Customer symptom: checkout readiness checks intermittently return `HTTP/2 503`.
- Edge header: `server: awselb/2.0`.
- Reported host/path: `checkout.example.com/healthz`.
- Current mitigation: none. Do not change DNS, ALB listener rules, or live Kubernetes objects from this lab.

## Impact And Change Clues

- Impact is limited to the checkout health path used by release and traffic automation.
- DNS still resolves to `k8s-payments-checkout-123456.us-west-2.elb.amazonaws.com`.
- The Ingress host/path still points at Service `checkout` port `http`.
- One ALB target reports `Target.ResponseCodeMismatch`; another target is healthy.
- The captured Service routes `port http: 80 -> targetPort web`.
- The captured Pod exposes the named port `http:8080`.

## Triage Order

1. Confirm the client-visible status and edge header.
2. Confirm DNS still reaches the expected ALB.
3. Compare ALB target health with the Kubernetes backend selected by Ingress.
4. Compare the Service `targetPort` name with the Pod port name.
5. Decide which owner must change the source manifest.
6. Save the diff, validation command, and no-cluster handoff note.

## Owner Notes

- DNS owner: no action unless the host resolves to the wrong ALB.
- ALB owner: no console-only fix unless target group or health path evidence contradicts Kubernetes evidence.
- App/platform owner: owns the source manifest when Service-to-Pod routing does not match the declared Pod port.
- Release owner: should require validation output before resuming rollout automation.
