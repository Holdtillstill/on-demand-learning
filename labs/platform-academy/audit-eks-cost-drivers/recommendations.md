# EKS Cost Recommendations

| Finding | Evidence | Owner | Expected Savings | Reliability Risk | Rollback |
| --- | --- | --- | --- | --- | --- |
| Checkout CPU over-requested | 6000m requested, 900m used | team-payments | Medium | Watch latency and HPA after right-size | Restore previous requests |
| Worker CPU and memory over-requested | 4000m/8192Mi requested, 350m/1024Mi used | team-payments | Medium | Watch queue lag and OOM events | Restore previous requests |
| Default load-test has unknown owner and zero usage | `default/load-test` owner unknown | platform | Low | Confirm no active test before scale-down | Reapply prior deployment |
| Abandoned demo LoadBalancer | `default/abandoned-demo` | platform | Low | Confirm DNS and traffic before delete | Recreate Service manifest |
| Abandoned cache PVC | `default/abandoned-cache` 200Gi gp2 | platform | Low | Snapshot before deletion | Restore from snapshot |

## Review Cadence

- Weekly: unknown owner and idle LoadBalancer report.
- Monthly: workload request versus usage review.
- Quarterly: storage class and retention review.
