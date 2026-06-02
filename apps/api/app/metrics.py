from prometheus_client import Counter, Gauge, Histogram

REQUEST_COUNT = Counter(
    "platform_academy_api_requests_total",
    "Total API requests",
    ["method", "path", "status_code"],
)
REQUEST_LATENCY = Histogram(
    "platform_academy_api_request_latency_seconds",
    "API request latency",
    ["method", "path"],
)
ERROR_COUNT = Counter("platform_academy_api_errors_total", "Total API errors", ["path"])
DB_HEALTH = Gauge("platform_academy_api_db_health", "Database health: 1 healthy, 0 unhealthy")
QUIZ_ATTEMPTS = Counter("platform_academy_quiz_attempts_total", "Quiz attempts submitted")
LESSON_COMPLETIONS = Counter("platform_academy_lesson_completions_total", "Lesson completion updates")
XP_AWARDED = Counter("platform_academy_xp_awarded_total", "XP awarded to learners", ["source"])
ACHIEVEMENTS_AWARDED = Counter("platform_academy_achievements_awarded_total", "Achievements awarded to learners", ["code"])
SRS_REVIEWS = Counter("platform_academy_srs_reviews_total", "Spaced repetition answers submitted", ["quality", "correct"])
PLATFORM_ACTIVITY_SAVES = Counter(
    "platform_academy_activity_saves_total",
    "Platform Academy activity state writes",
    ["target_type", "state"],
)
PLATFORM_LAB_SUBMISSIONS = Counter(
    "platform_academy_lab_submissions_total",
    "Platform Academy lab workbook submissions",
    ["lab_slug", "status"],
)
PLATFORM_LAB_BUNDLE_DOWNLOADS = Counter(
    "platform_academy_lab_bundle_downloads_total",
    "Platform Academy lab artifact bundle downloads",
    ["lab_slug"],
)
PLATFORM_LAB_PACKET_DOWNLOADS = Counter(
    "platform_academy_lab_packet_downloads_total",
    "Platform Academy lab packet downloads",
    ["lab_slug"],
)
PLATFORM_DASHBOARD_READS = Counter(
    "platform_academy_dashboard_reads_total",
    "User dashboard reads grouped by learning domain",
    ["domain"],
)
