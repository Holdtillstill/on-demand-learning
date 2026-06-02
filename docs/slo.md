# SLOs

## User-Facing API Availability

Objective: 99.5% monthly availability for successful API requests.

SLI:

```promql
sum(rate(platform_academy_api_requests_total{status_code!~"5.."}[5m]))
/
sum(rate(platform_academy_api_requests_total[5m]))
```

Alert example: page when 5xx success ratio burns more than 2% of the monthly error budget in one hour.

## API Latency

Objective: 95% of API requests complete under 500 ms over 30 days.

SLI:

```promql
histogram_quantile(0.95, sum by (le) (rate(platform_academy_api_request_latency_seconds_bucket[5m])))
```

Alert example: warn when p95 latency is above 750 ms for 15 minutes.

## Worker Freshness

Objective: recommendation refresh job succeeds at least once every 10 minutes.

SLI:

```promql
increase(platform_academy_worker_jobs_total{job="refresh_recommendations"}[10m]) > 0
```

Alert example: page during business hours if no successful refresh occurs for 15 minutes.
