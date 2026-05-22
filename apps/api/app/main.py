import logging
import time
from collections import defaultdict, deque
from uuid import uuid4

import redis
from fastapi import Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import or_, text
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.database import Base, SessionLocal, check_database, engine, get_db
from app.logging_config import configure_logging
from app.metrics import DB_HEALTH, ERROR_COUNT, LESSON_COMPLETIONS, QUIZ_ATTEMPTS, REQUEST_COUNT, REQUEST_LATENCY
from app.models import Course, Flashcard, Lesson, Progress, QuizAttempt, User, VocabularyTerm
from app.schemas import (
    CourseCreate,
    CourseOut,
    FlashcardOut,
    LessonOut,
    ProgressIn,
    ProgressOut,
    QuizAttemptIn,
    QuizAttemptOut,
    SearchResult,
)
from app.seed import seed_database
from app.telemetry import configure_tracing

configure_logging()
logger = logging.getLogger("zhongwen.api")
settings = get_settings()
app = FastAPI(title="Zhongwen Cloud Learning Platform API", version="0.1.0")
configure_tracing(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_windows: dict[str, deque[float]] = defaultdict(deque)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    if settings.auto_seed:
        with SessionLocal() as db:
            seed_database(db)
    logger.info("api_started", extra={"request_id": "-", "path": "-", "method": "-", "status_code": 0, "duration_ms": 0})


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    request.state.request_id = request_id
    client = request.client.host if request.client else "unknown"
    now = time.time()
    window = request_windows[client]
    while window and now - window[0] > 60:
        window.popleft()
    if len(window) >= settings.rate_limit_per_minute:
        ERROR_COUNT.labels(path=request.url.path).inc()
        return Response("rate limit exceeded", status_code=429, headers={"x-request-id": request_id})
    window.append(now)

    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        ERROR_COUNT.labels(path=request.url.path).inc()
        logger.exception(
            "request_failed",
            extra={"request_id": request_id, "path": request.url.path, "method": request.method, "status_code": 500, "duration_ms": 0},
        )
        raise
    duration = time.perf_counter() - start
    response.headers["x-request-id"] = request_id
    REQUEST_COUNT.labels(request.method, request.url.path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, request.url.path).observe(duration)
    logger.info(
        "request_complete",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        },
    )
    return response


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/readyz")
def readyz() -> dict[str, str]:
    try:
        check_database()
        redis.from_url(settings.redis_url).ping()
        DB_HEALTH.set(1)
    except Exception as exc:
        DB_HEALTH.set(0)
        raise HTTPException(status_code=503, detail=f"dependency unavailable: {exc}") from exc
    return {"status": "ready"}


@app.get("/metrics")
def metrics() -> Response:
    try:
        check_database()
        DB_HEALTH.set(1)
    except Exception:
        DB_HEALTH.set(0)
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/courses", response_model=list[CourseOut])
def list_courses(category: str | None = None, level: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Course).options(joinedload(Course.lessons)).order_by(Course.id)
    if category:
        query = query.filter(Course.category == category)
    if level:
        query = query.filter(Course.level == level)
    return query.all()


@app.get("/api/courses/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).options(joinedload(Course.lessons)).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="course not found")
    return course


@app.get("/api/lessons/{lesson_id}", response_model=LessonOut)
def get_lesson(lesson_id: int, db: Session = Depends(get_db)):
    lesson = (
        db.query(Lesson)
        .options(joinedload(Lesson.vocabulary), joinedload(Lesson.flashcards))
        .filter(Lesson.id == lesson_id)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="lesson not found")
    return lesson


@app.post("/api/progress", response_model=ProgressOut)
def upsert_progress(payload: ProgressIn, db: Session = Depends(get_db)):
    user = db.get(User, payload.user_id)
    if not user:
        db.add(User(id=payload.user_id, display_name=payload.user_id, subscription_status="mock_active"))
    progress = db.query(Progress).filter(Progress.user_id == payload.user_id, Progress.lesson_id == payload.lesson_id).first()
    if not progress:
        progress = Progress(user_id=payload.user_id, lesson_id=payload.lesson_id)
        db.add(progress)
    progress.completed = payload.completed
    progress.score = payload.score
    db.commit()
    db.refresh(progress)
    if payload.completed:
        LESSON_COMPLETIONS.inc()
    return progress


@app.get("/api/progress/{user_id}", response_model=list[ProgressOut])
def get_progress(user_id: str, db: Session = Depends(get_db)):
    return db.query(Progress).filter(Progress.user_id == user_id).order_by(Progress.updated_at.desc()).all()


@app.get("/api/search", response_model=SearchResult)
def search(q: str, db: Session = Depends(get_db)):
    pattern = f"%{q}%"
    courses = (
        db.query(Course)
        .options(joinedload(Course.lessons))
        .filter(
            or_(
                Course.title.ilike(pattern),
                Course.description.ilike(pattern),
                Course.category.ilike(pattern),
                Course.era.ilike(pattern),
            )
        )
        .limit(10)
        .all()
    )
    lessons = (
        db.query(Lesson)
        .filter(
            or_(
                Lesson.title.ilike(pattern),
                Lesson.summary.ilike(pattern),
                Lesson.body_simplified.ilike(pattern),
                Lesson.pinyin.ilike(pattern),
            )
        )
        .limit(10)
        .all()
    )
    return {"courses": courses, "lessons": lessons}


@app.get("/api/flashcards", response_model=list[FlashcardOut])
def list_flashcards(lesson_id: int | None = None, difficulty: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Flashcard).order_by(Flashcard.id)
    if lesson_id:
        query = query.filter(Flashcard.lesson_id == lesson_id)
    if difficulty:
        query = query.filter(Flashcard.difficulty == difficulty)
    return query.limit(50).all()


@app.post("/api/quiz/attempts", response_model=QuizAttemptOut)
def create_quiz_attempt(payload: QuizAttemptIn, db: Session = Depends(get_db)):
    if not db.get(User, payload.user_id):
        db.add(User(id=payload.user_id, display_name=payload.user_id, subscription_status="mock_active"))
    attempt = QuizAttempt(user_id=payload.user_id, lesson_id=payload.lesson_id, score=payload.score, answers=payload.answers)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    QUIZ_ATTEMPTS.inc()
    return attempt


@app.post("/api/admin/courses", response_model=CourseOut, status_code=status.HTTP_201_CREATED)
def admin_create_course(payload: CourseCreate, db: Session = Depends(get_db)):
    existing = db.query(Course).filter(Course.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=409, detail="course slug already exists")

    course = Course(
        slug=payload.slug,
        title=payload.title,
        era=payload.era,
        level=payload.level,
        category=payload.category,
        description=payload.description,
        subscription_tier=payload.subscription_tier,
    )
    db.add(course)
    db.flush()

    for index, lesson_data in enumerate(payload.lessons, start=1):
        lesson = Lesson(
            course_id=course.id,
            title=lesson_data.title,
            summary=lesson_data.summary,
            body_simplified=lesson_data.body_simplified,
            body_traditional=lesson_data.body_traditional,
            pinyin=lesson_data.pinyin,
            audio_url=lesson_data.audio_url,
            video_url=lesson_data.video_url,
            sequence=index,
        )
        db.add(lesson)
        db.flush()
        for term in lesson_data.vocabulary:
            db.add(
                VocabularyTerm(
                    lesson_id=lesson.id,
                    simplified=term.simplified,
                    traditional=term.traditional,
                    pinyin=term.pinyin,
                    definition=term.definition,
                )
            )
        for card in lesson_data.flashcards:
            db.add(
                Flashcard(
                    lesson_id=lesson.id,
                    prompt=card.prompt,
                    answer=card.answer,
                    pinyin=card.pinyin,
                    difficulty=card.difficulty,
                )
            )

    db.commit()
    created = db.query(Course).options(joinedload(Course.lessons)).filter(Course.id == course.id).one()
    logger.info(
        "admin_course_created",
        extra={"request_id": "-", "path": "/api/admin/courses", "method": "POST", "status_code": 201, "duration_ms": 0},
    )
    return created


@app.get("/api/admin/seed")
def admin_seed(db: Session = Depends(get_db)):
    seed_database(db)
    return {"status": "seeded"}


@app.get("/api/admin/db-ping")
def admin_db_ping(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
