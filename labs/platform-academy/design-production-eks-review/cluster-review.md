# Production EKS Architecture Review Evidence

Cluster proposal:
  Name: academy-prod
  Region: us-west-2
  Endpoint: public and private
  Node groups: system, apps, stateful

Node placement:
  system-a   zone=us-west-2a  taints=CriticalAddonsOnly=true:NoSchedule
  apps-a     zone=us-west-2a  labels=workload=apps,cost-center=platform
  apps-b     zone=us-west-2b  labels=workload=apps,cost-center=platform
  apps-c     zone=us-west-2c  labels=workload=apps
  stateful-a zone=us-west-2a  labels=workload=stateful

Critical workloads:
  payments/checkout replicas=3 spread=us-west-2a,us-west-2b,us-west-2c pdb=maxUnavailable:1
  payments/worker   replicas=1 spread=us-west-2a pdb=missing
  data/postgres     replicas=1 volume=gp3-us-west-2a recovery=restore-from-snapshot
  ingress/alb       replicas=2 spread=us-west-2a,us-west-2b

Cost and guardrails:
  Missing cost label on apps-c.
  NAT gateway per AZ is planned.
  LoadBalancer review is manual.
  No idle-request report exists.

Upgrade pause points:
  Check deprecated APIs before control-plane upgrade.
  Pause if controller add-ons have no version compatibility matrix.
  Pause if PDBs block managed node group rotation.
