import logging
import os
import sys
import time

import redis
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from prometheus_client import Counter, Gauge, start_http_server
from pythonjsonlogger import json as jsonlogger
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://zhongwen:zhongwen@postgres:5432/zhongwen")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
OTEL_ENDPOINT = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://jaeger:4318")
INTERVAL_SECONDS = int(os.getenv("WORKER_INTERVAL_SECONDS", "30"))

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s %(job)s %(duration_ms)s"))
logging.basicConfig(level=logging.INFO, handlers=[handler])
logger = logging.getLogger("zhongwen.worker")

resource = Resource.create({"service.name": "zhongwen-worker", "deployment.environment": os.getenv("ENVIRONMENT", "local")})
provider = TracerProvider(resource=resource)
if OTEL_ENDPOINT:
    provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter(endpoint=f"{OTEL_ENDPOINT}/v1/traces")))
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)

JOB_COUNT = Counter("zhongwen_worker_jobs_total", "Worker jobs completed", ["job"])
JOB_FAILURES = Counter("zhongwen_worker_job_failures_total", "Worker jobs failed", ["job"])
RECOMMENDATIONS = Gauge("zhongwen_worker_recommendations", "Current recommendation rows")
DUE_CARDS = Gauge("zhongwen_worker_due_flashcards", "Due flashcards for demo-user")


def refresh_recommendations() -> int:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.begin() as connection:
        users = connection.execute(text("SELECT id FROM users")).mappings().all()
        courses = connection.execute(text("SELECT id, title, category FROM courses ORDER BY id")).mappings().all()
        inserted = 0
        for user in users:
            completed_categories = connection.execute(
                text(
                    """
                    SELECT DISTINCT c.category
                    FROM progress p
                    JOIN lessons l ON p.lesson_id = l.id
                    JOIN courses c ON l.course_id = c.id
                    WHERE p.user_id = :user_id AND p.completed = true
                    """
                ),
                {"user_id": user["id"]},
            ).scalars().all()
            candidate = next(
                (course for course in courses if course["category"] not in completed_categories),
                courses[0] if courses else None,
            )
            if not candidate:
                continue
            connection.execute(text("DELETE FROM recommendations WHERE user_id = :user_id"), {"user_id": user["id"]})
            connection.execute(
                text(
                    """
                    INSERT INTO recommendations (user_id, course_id, reason, created_at)
                    VALUES (:user_id, :course_id, :reason, CURRENT_TIMESTAMP)
                    """
                ),
                {
                    "user_id": user["id"],
                    "course_id": candidate["id"],
                    "reason": f"Next useful track: {candidate['category']} through {candidate['title']}",
                },
            )
            inserted += 1
        total = connection.execute(text("SELECT COUNT(*) FROM recommendations")).scalar_one()
    RECOMMENDATIONS.set(total)
    return inserted


def publish_due_card_count() -> int:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    redis_client = redis.from_url(REDIS_URL)
    with engine.connect() as connection:
        count = connection.execute(
            text(
                """
                SELECT COUNT(*)
                FROM flashcards f
                LEFT JOIN review_states rs
                  ON rs.flashcard_id = f.id
                 AND rs.user_id = 'demo-user'
                WHERE rs.id IS NULL
                   OR rs.due_at <= CURRENT_TIMESTAMP
                """
            )
        ).scalar_one()
    redis_client.set("zhongwen:due_flashcards:demo-user", count)
    DUE_CARDS.set(count)
    return count


def run_job(name: str, func) -> None:
    start = time.perf_counter()
    with tracer.start_as_current_span(name):
        try:
            result = func()
            JOB_COUNT.labels(job=name).inc()
            logger.info(
                "job_complete",
                extra={"job": name, "duration_ms": round((time.perf_counter() - start) * 1000, 2), "result": result},
            )
        except Exception:
            JOB_FAILURES.labels(job=name).inc()
            logger.exception("job_failed", extra={"job": name, "duration_ms": round((time.perf_counter() - start) * 1000, 2)})


def main() -> None:
    start_http_server(9100)
    logger.info("worker_started", extra={"job": "startup", "duration_ms": 0})
    while True:
        run_job("refresh_recommendations", refresh_recommendations)
        run_job("publish_due_card_count", publish_due_card_count)
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
