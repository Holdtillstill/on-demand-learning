from prometheus_client import Counter, Gauge, Histogram

REQUEST_COUNT = Counter(
    "zhongwen_api_requests_total",
    "Total API requests",
    ["method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "zhongwen_api_request_latency_seconds",
    "API request latency",
    ["method", "path"],
)
ERROR_COUNT = Counter("zhongwen_api_errors_total", "Total API errors", ["path"])
DB_HEALTH = Gauge("zhongwen_api_db_health", "Database health: 1 healthy, 0 unhealthy")
QUIZ_ATTEMPTS = Counter("zhongwen_quiz_attempts_total", "Quiz attempts submitted")
LESSON_COMPLETIONS = Counter("zhongwen_lesson_completions_total", "Lesson completion updates")
