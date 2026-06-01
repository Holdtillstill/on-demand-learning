# Checkout SLO Incident Signals

SLO:
  Availability: 99.9% successful checkout API requests over 30 days
  Fast burn page: 2% 5xx ratio for 10 minutes

Current alert:
  CheckoutHighErrorBudgetBurn firing for 14 minutes

Recent rollout:
  REVISION  CHANGE-CAUSE
  41        checkout@sha256:aaaa
  42        checkout@sha256:bbbb canary 10%
  43        checkout@sha256:bbbb canary 100%

Events:
  10:21:04 payments checkout rollout completed revision 43
  10:23:19 payments checkout pods readiness flapping
  10:25:03 ingress target group unhealthy threshold crossed

Mitigation choices:
  - Roll back Deployment if errors correlate with revision 43.
  - Reduce traffic to canary if progressive delivery is still active.
  - Escalate to app owner if dependency errors dominate traces.
