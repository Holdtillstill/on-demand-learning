import logging
import time
from collections import defaultdict, deque
from datetime import date, datetime, timedelta
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
from app.metrics import (
    ACHIEVEMENTS_AWARDED,
    DB_HEALTH,
    ERROR_COUNT,
    LESSON_COMPLETIONS,
    QUIZ_ATTEMPTS,
    REQUEST_COUNT,
    REQUEST_LATENCY,
    SRS_REVIEWS,
    XP_AWARDED,
)
from app.models import (
    CharacterMetadata,
    Course,
    Flashcard,
    Lesson,
    Progress,
    QuizAttempt,
    ReviewState,
    User,
    UserAchievement,
    VocabularyTerm,
    XpEvent,
)
from app.platform_content import PLATFORM_ACADEMY_ERA, PLATFORM_LABS, PLATFORM_LEVELS, PLATFORM_RESOURCES, PLATFORM_ROADMAP, PLATFORM_TRACKS
from app.schemas import (
    CharacterOut,
    CourseCreate,
    CourseOut,
    DueReviewQueue,
    FlashcardOut,
    LearningPathOut,
    LessonOut,
    PlatformAcademyCatalogOut,
    PlatformAcademyRoadmapOut,
    PlatformLabOut,
    PlatformResourcesOut,
    ProgressIn,
    ProgressOut,
    QuizAttemptIn,
    QuizAttemptOut,
    ReviewAnswerIn,
    ReviewStateOut,
    SearchResult,
    UserDashboard,
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

DAILY_GOAL_XP = 50

ACHIEVEMENTS = [
    {
        "code": "first_lesson",
        "title": "First Lesson",
        "description": "Complete one lesson.",
        "target": 1,
    },
    {
        "code": "poetry_explorer",
        "title": "Poetry Explorer",
        "description": "Complete a literature or Tang poetry lesson.",
        "target": 1,
    },
    {
        "code": "character_builder",
        "title": "Character Builder",
        "description": "Complete a character building lesson or review character cards.",
        "target": 1,
    },
    {
        "code": "seven_day_streak",
        "title": "Seven Day Streak",
        "description": "Record learner XP on seven consecutive days.",
        "target": 7,
    },
]


def ensure_user(db: Session, user_id: str) -> None:
    if not db.get(User, user_id):
        db.add(User(id=user_id, display_name=user_id, subscription_status="mock_active"))


def add_xp_event(db: Session, user_id: str, source: str, source_id: int, xp: int) -> None:
    existing = db.query(XpEvent).filter(XpEvent.user_id == user_id, XpEvent.source == source, XpEvent.source_id == source_id).first()
    if existing:
        return
    db.add(XpEvent(user_id=user_id, source=source, source_id=source_id, xp=xp))
    XP_AWARDED.labels(source=source).inc(xp)


def completed_progress_query(db: Session, user_id: str):
    return db.query(Progress).join(Lesson, Progress.lesson_id == Lesson.id).join(Course, Lesson.course_id == Course.id).filter(
        Progress.user_id == user_id,
        Progress.completed.is_(True),
    )


def current_streak_days(activity_dates: set[date]) -> int:
    if not activity_dates:
        return 0
    cursor = datetime.utcnow().date()
    streak = 0
    while cursor in activity_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def due_review_count(db: Session, user_id: str) -> int:
    now = datetime.utcnow()
    cards = db.query(Flashcard.id).all()
    count = 0
    for (flashcard_id,) in cards:
        state = db.query(ReviewState).filter(ReviewState.user_id == user_id, ReviewState.flashcard_id == flashcard_id).first()
        if not state or state.due_at <= now:
            count += 1
    return count


def apply_course_domain_filter(query, domain: str | None):
    selected = (domain or "all").lower()
    if selected == "all":
        return query
    if selected == "platform":
        return query.filter(Course.era == PLATFORM_ACADEMY_ERA)
    if selected == "zhongwen":
        return query.filter(Course.era != PLATFORM_ACADEMY_ERA)
    raise HTTPException(status_code=400, detail="domain must be one of: all, zhongwen, platform")


def platform_courses(db: Session) -> list[Course]:
    courses = (
        db.query(Course)
        .options(joinedload(Course.lessons))
        .filter(Course.era == PLATFORM_ACADEMY_ERA)
        .order_by(Course.id)
        .all()
    )
    course_by_slug = {course.slug: course for course in courses}
    ordered_slugs = [track["course_slug"] for track in PLATFORM_TRACKS]
    return [course_by_slug[slug] for slug in ordered_slugs if slug in course_by_slug]


def platform_lab_payloads(courses: list[Course]) -> list[dict]:
    course_by_slug = {course.slug: course for course in courses}
    labs = []
    for lab in PLATFORM_LABS:
        course = course_by_slug.get(lab["course_slug"])
        lesson_id = None
        if course:
            lesson_id = next((lesson.id for lesson in course.lessons if lesson.title == lab["lesson_title"]), None)
        labs.append(
            {
                "slug": lab["slug"],
                "title": lab["title"],
                "track": lab["track"],
                "difficulty": lab["difficulty"],
                "level_group": lab["level_group"],
                "estimated_minutes": lab["estimated_minutes"],
                "scenario": lab["scenario"],
                "skills": lab["skills"],
                "commands": lab["commands"],
                "checklist": lab["checklist"],
                "course_slug": lab["course_slug"],
                "lesson_id": lesson_id,
            }
        )
    return labs


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
def list_courses(category: str | None = None, level: str | None = None, domain: str = "all", db: Session = Depends(get_db)):
    query = db.query(Course).options(joinedload(Course.lessons)).order_by(Course.id)
    query = apply_course_domain_filter(query, domain)
    if category:
        query = query.filter(Course.category == category)
    if level:
        query = query.filter(Course.level == level)
    return query.all()


@app.get("/api/platform-academy/catalog", response_model=PlatformAcademyCatalogOut)
def get_platform_academy_catalog(db: Session = Depends(get_db)):
    courses = platform_courses(db)
    course_by_slug = {course.slug: course for course in courses}
    levels = []
    for level in PLATFORM_LEVELS:
        level_courses = [course_by_slug[slug] for slug in level["course_slugs"] if slug in course_by_slug]
        levels.append(
            {
                "slug": level["slug"],
                "title": level["title"],
                "level_group": level["level_group"],
                "audience": level["audience"],
                "total_courses": len(level_courses),
                "total_lessons": sum(len(course.lessons) for course in level_courses),
                "courses": level_courses,
            }
        )
    tracks = []
    for track in PLATFORM_TRACKS:
        course = course_by_slug.get(track["course_slug"])
        if not course:
            continue
        tracks.append(
            {
                "slug": track["slug"],
                "title": track["title"],
                "role": track["role"],
                "summary": track["summary"],
                "level_group": track["level_group"],
                "audience": track["audience"],
                "outcomes": track["outcomes"],
                "course": course,
            }
        )
    return {
        "title": "Platform Academy",
        "promise": "Learn Kubernetes, EKS, Helm, ArgoCD, and SRE through production platform scenarios you can practice locally.",
        "total_courses": len(courses),
        "total_lessons": sum(len(course.lessons) for course in courses),
        "levels": levels,
        "tracks": tracks,
        "labs": platform_lab_payloads(courses),
    }


@app.get("/api/platform-academy/roadmap", response_model=PlatformAcademyRoadmapOut)
def get_platform_academy_roadmap():
    return {"stages": PLATFORM_ROADMAP}


@app.get("/api/platform-academy/labs", response_model=list[PlatformLabOut])
def get_platform_academy_labs(db: Session = Depends(get_db)):
    return platform_lab_payloads(platform_courses(db))


@app.get("/api/platform-academy/resources", response_model=PlatformResourcesOut)
def get_platform_academy_resources():
    return {
        "domains": sorted({resource["domain"] for resource in PLATFORM_RESOURCES}),
        "types": sorted({resource["resource_type"] for resource in PLATFORM_RESOURCES}),
        "resources": PLATFORM_RESOURCES,
    }


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
        .options(joinedload(Lesson.course), joinedload(Lesson.vocabulary), joinedload(Lesson.flashcards))
        .filter(Lesson.id == lesson_id)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="lesson not found")
    return lesson


@app.post("/api/progress", response_model=ProgressOut)
def upsert_progress(payload: ProgressIn, db: Session = Depends(get_db)):
    ensure_user(db, payload.user_id)
    progress = db.query(Progress).filter(Progress.user_id == payload.user_id, Progress.lesson_id == payload.lesson_id).first()
    was_completed = progress.completed if progress else False
    if not progress:
        progress = Progress(user_id=payload.user_id, lesson_id=payload.lesson_id)
        db.add(progress)
    progress.completed = payload.completed
    progress.score = payload.score
    if payload.completed and not was_completed:
        add_xp_event(db, payload.user_id, "lesson_completion", payload.lesson_id, 20)
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
    ensure_user(db, payload.user_id)
    attempt = QuizAttempt(user_id=payload.user_id, lesson_id=payload.lesson_id, score=payload.score, answers=payload.answers)
    db.add(attempt)
    db.flush()
    add_xp_event(db, payload.user_id, "quiz_attempt", attempt.id, max(1, round(payload.score * 10)))
    db.commit()
    db.refresh(attempt)
    QUIZ_ATTEMPTS.inc()
    return attempt


@app.get("/api/learning-path", response_model=LearningPathOut)
def get_learning_path(user_id: str = "demo-user", domain: str = "zhongwen", db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    query = db.query(Course).options(joinedload(Course.lessons)).order_by(Course.id)
    courses = apply_course_domain_filter(query, domain).all()
    progress_rows = db.query(Progress).filter(Progress.user_id == user_id).all()
    progress_by_lesson = {row.lesson_id: row for row in progress_rows}

    ordered_lessons = [lesson for course in courses for lesson in sorted(course.lessons, key=lambda item: item.sequence)]
    recommended_lesson_id = next(
        (lesson.id for lesson in ordered_lessons if not progress_by_lesson.get(lesson.id) or not progress_by_lesson[lesson.id].completed),
        None,
    )

    modules = []
    for course_index, course in enumerate(courses, start=1):
        path_lessons = []
        for lesson in sorted(course.lessons, key=lambda item: item.sequence):
            progress = progress_by_lesson.get(lesson.id)
            if progress and progress.completed:
                state = "completed"
            elif lesson.id == recommended_lesson_id:
                state = "recommended"
            else:
                state = "locked"
            path_lessons.append(
                {
                    "id": lesson.id,
                    "title": lesson.title,
                    "summary": lesson.summary,
                    "sequence": lesson.sequence,
                    "state": state,
                    "score": progress.score if progress else None,
                }
            )
        modules.append(
            {
                "course_id": course.id,
                "slug": course.slug,
                "title": course.title,
                "category": course.category,
                "era": course.era,
                "level": course.level,
                "sequence": course_index,
                "locked": all(lesson["state"] == "locked" for lesson in path_lessons),
                "lessons": path_lessons,
            }
        )
    return {"user_id": user_id, "recommended_lesson_id": recommended_lesson_id, "modules": modules}


def achievement_progress(db: Session, user_id: str, streak_days: int) -> dict[str, int]:
    completed = completed_progress_query(db, user_id).all()
    completed_count = len(completed)
    poetry_count = sum(
        1
        for progress in completed
        if progress.lesson.course.category == "Literature" or progress.lesson.course.era == "Tang"
    )
    character_progress = sum(1 for progress in completed if progress.lesson.course.category == "Characters")
    character_reviews = db.query(ReviewState).filter(ReviewState.user_id == user_id, ReviewState.last_reviewed_at.is_not(None)).count()
    return {
        "first_lesson": completed_count,
        "poetry_explorer": poetry_count,
        "character_builder": character_progress + character_reviews,
        "seven_day_streak": streak_days,
    }


def award_earned_achievements(db: Session, user_id: str, progress_by_code: dict[str, int]) -> list[dict]:
    existing = {achievement.code: achievement for achievement in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()}
    response = []
    for definition in ACHIEVEMENTS:
        code = definition["code"]
        progress = progress_by_code.get(code, 0)
        target = definition["target"]
        earned = progress >= target
        awarded = existing.get(code)
        if earned and not awarded:
            awarded = UserAchievement(user_id=user_id, code=code)
            db.add(awarded)
            db.flush()
            existing[code] = awarded
            ACHIEVEMENTS_AWARDED.labels(code=code).inc()
        response.append(
            {
                "code": code,
                "title": definition["title"],
                "description": definition["description"],
                "earned": earned,
                "progress": min(progress, target),
                "target": target,
                "awarded_at": awarded.awarded_at if awarded else None,
            }
        )
    return response


@app.get("/api/users/{user_id}/dashboard", response_model=UserDashboard)
def get_user_dashboard(user_id: str, db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    events = db.query(XpEvent).filter(XpEvent.user_id == user_id).order_by(XpEvent.created_at.desc()).all()
    lesson_xp = sum(event.xp for event in events if event.source == "lesson_completion")
    quiz_xp = sum(event.xp for event in events if event.source == "quiz_attempt")
    review_xp = sum(event.xp for event in events if event.source == "srs_review")
    total_xp = sum(event.xp for event in events)
    today = datetime.utcnow().date()
    earned_today = sum(event.xp for event in events if event.created_at.date() == today)
    activity_dates = {event.created_at.date() for event in events}
    streak_days = current_streak_days(activity_dates)
    progress_by_code = achievement_progress(db, user_id, streak_days)
    achievements = award_earned_achievements(db, user_id, progress_by_code)
    completed_lessons = progress_by_code["first_lesson"]
    due_reviews = due_review_count(db, user_id)
    db.commit()
    return {
        "user_id": user_id,
        "xp": {"total": total_xp, "lesson_completion_xp": lesson_xp, "quiz_xp": quiz_xp, "review_xp": review_xp},
        "daily_goal": {"target_xp": DAILY_GOAL_XP, "earned_xp_today": earned_today, "met": earned_today >= DAILY_GOAL_XP},
        "streak": {
            "current_days": streak_days,
            "freeze_available": total_xp >= 100 and streak_days > 0,
            "last_activity_date": max(activity_dates).isoformat() if activity_dates else None,
        },
        "achievements": achievements,
        "completed_lessons": completed_lessons,
        "due_reviews": due_reviews,
    }


@app.get("/api/reviews/due", response_model=DueReviewQueue)
def get_due_reviews(user_id: str = "demo-user", limit: int = 20, db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    now = datetime.utcnow()
    cards = db.query(Flashcard).order_by(Flashcard.id).limit(200).all()
    due_cards = []
    for card in cards:
        state = db.query(ReviewState).filter(ReviewState.user_id == user_id, ReviewState.flashcard_id == card.id).first()
        if state and state.due_at > now:
            continue
        due_cards.append(
            {
                "id": card.id,
                "lesson_id": card.lesson_id,
                "prompt": card.prompt,
                "answer": card.answer,
                "pinyin": card.pinyin,
                "difficulty": card.difficulty,
                "due_at": state.due_at if state else now,
                "interval_days": state.interval_days if state else 0,
                "ease": state.ease if state else 2.5,
            }
        )
        if len(due_cards) >= limit:
            break
    return {"user_id": user_id, "generated_at": now, "count": len(due_cards), "cards": due_cards}


@app.post("/api/reviews/{flashcard_id}/answer", response_model=ReviewStateOut)
def answer_review(flashcard_id: int, payload: ReviewAnswerIn, db: Session = Depends(get_db)):
    ensure_user(db, payload.user_id)
    if not db.get(Flashcard, flashcard_id):
        raise HTTPException(status_code=404, detail="flashcard not found")
    state = db.query(ReviewState).filter(ReviewState.user_id == payload.user_id, ReviewState.flashcard_id == flashcard_id).first()
    if not state:
        state = ReviewState(user_id=payload.user_id, flashcard_id=flashcard_id, ease=2.5, interval_days=0, due_at=datetime.utcnow())
        db.add(state)
    now = datetime.utcnow()
    if payload.correct and payload.quality >= 3:
        if state.interval_days <= 0:
            state.interval_days = 1
        elif state.interval_days == 1:
            state.interval_days = 3
        else:
            state.interval_days = max(state.interval_days + 1, round(state.interval_days * state.ease))
        state.ease = max(1.3, state.ease + (payload.quality - 3) * 0.12)
        state.due_at = now + timedelta(days=state.interval_days)
    else:
        state.interval_days = 0
        state.ease = max(1.3, state.ease - 0.2)
        state.due_at = now + timedelta(minutes=10)
    state.last_reviewed_at = now
    SRS_REVIEWS.labels(quality=str(payload.quality), correct=str(payload.correct).lower()).inc()
    add_xp_event(db, payload.user_id, "srs_review", flashcard_id, 2 if payload.correct else 1)
    db.commit()
    db.refresh(state)
    return state


@app.get("/api/characters", response_model=list[CharacterOut])
def list_characters(db: Session = Depends(get_db)):
    return db.query(CharacterMetadata).order_by(CharacterMetadata.strokes, CharacterMetadata.id).all()


@app.get("/api/characters/{character_id}", response_model=CharacterOut)
def get_character(character_id: int, db: Session = Depends(get_db)):
    character = db.get(CharacterMetadata, character_id)
    if not character:
        raise HTTPException(status_code=404, detail="character not found")
    return character


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
