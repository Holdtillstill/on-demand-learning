# Incident Tabletop Signals

Incident:
  Checkout 5xx rate rose from 0.2% to 9.4% after canary promotion.

Impact:
  Users can browse catalog but payment confirmation intermittently fails.

Current state:
  SEV-2 declared
  Mitigation pending
  Next stakeholder update due in 15 minutes

Kubernetes evidence:
  10:57 checkout revision 43 promoted to 100%
  11:01 checkout readiness flapping on 7/12 Pods
  11:04 ingress target unhealthy threshold crossed
  11:06 rollback option identified: revision 42

Decision pressure:
  App owner wants logs first.
  Support wants a public status update.
  Platform owner wants rollback unless impact drops in 5 minutes.
