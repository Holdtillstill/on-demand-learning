import logging
import re
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager
from datetime import date, timedelta
from hmac import compare_digest
from io import BytesIO
from ipaddress import ip_address, ip_network
from pathlib import Path
from uuid import uuid4
from zipfile import ZIP_DEFLATED, ZipFile

import redis
from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import or_, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.config import LOCAL_SOURCE_BUNDLE_ENVIRONMENTS, get_settings
from app.database import Base, SessionLocal, check_database, engine, get_db
from app.logging_config import configure_logging
from app.metrics import (
    ACHIEVEMENTS_AWARDED,
    DB_HEALTH,
    ERROR_COUNT,
    LESSON_COMPLETIONS,
    PLATFORM_ACTIVITY_SAVES,
    PLATFORM_DASHBOARD_READS,
    PLATFORM_LAB_BUNDLE_DOWNLOADS,
    PLATFORM_LAB_PACKET_DOWNLOADS,
    PLATFORM_LAB_SUBMISSIONS,
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
    PlatformActivity,
    PlatformLabSubmission,
    Progress,
    QuizAttempt,
    ReviewState,
    User,
    UserAchievement,
    VocabularyTerm,
    XpEvent,
)
from app.platform_content import (
    PLATFORM_ACADEMY_ERA,
    PLATFORM_INTERVIEW_PREP,
    PLATFORM_LABS,
    PLATFORM_LEVELS,
    PLATFORM_RESOURCES,
    PLATFORM_ROADMAP,
    PLATFORM_TRACKS,
)
from app.platform_lab_artifacts import (
    LabArtifactError,
    cluster_workspace_commands,
    lab_packet_markdown,
    learner_artifact_paths,
    write_learner_workspace_archive,
    write_source_bundle_archive,
)
from app.schemas import (
    MAX_PLATFORM_STATE_ACTIVITY_ROWS,
    MAX_PLATFORM_STATE_CHECKED_FIELDS,
    MAX_PLATFORM_STATE_FIELD_KEY_LENGTH,
    MAX_PLATFORM_STATE_LAB_ROWS,
    MAX_PLATFORM_STATE_PROGRESS_ROWS,
    MAX_PLATFORM_STATE_WORKSHEET_FIELDS,
    MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH,
    MAX_USER_ID_LENGTH,
    USER_ID_PATTERN,
    CharacterOut,
    CourseCreate,
    CourseOut,
    DueReviewQueue,
    FlashcardOut,
    LearningPathOut,
    LessonOut,
    PlatformAcademyCatalogOut,
    PlatformAcademyRoadmapOut,
    PlatformActivityIn,
    PlatformActivityOut,
    PlatformInterviewPrepIndexOut,
    PlatformLabOut,
    PlatformLabSubmissionIn,
    PlatformLabSubmissionOut,
    PlatformLearnerStateExport,
    PlatformLearnerStateImportIn,
    PlatformLearnerStateImportOut,
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
from app.time_utils import utc_now, utc_today

configure_logging()
logger = logging.getLogger("zhongwen.api")
settings = get_settings()
SOURCE_BUNDLE_TOKEN_HEADER = "X-Platform-Source-Bundle-Token"


def initialize_application() -> None:
    if settings.create_schema_on_startup:
        Base.metadata.create_all(bind=engine)
    if settings.auto_seed:
        with SessionLocal() as db:
            seed_database(db)
    logger.info("api_started", extra={"request_id": "-", "path": "-", "method": "-", "status_code": 0, "duration_ms": 0})


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_application()
    yield


app = FastAPI(title="Zhongwen Cloud Learning Platform API", version="0.1.0", lifespan=lifespan)
configure_tracing(app)

PLATFORM_STATE_EXPORT_DESCRIPTION = (
    "Exports a portable JSON backup for a Platform Academy guest profile. "
    "The backup is intentionally scoped to Platform Academy lesson progress, saved activity, and lab workbook submissions; "
    "it does not include Zhongwen course progress or credentials. "
    f"The response is capped at {MAX_PLATFORM_STATE_PROGRESS_ROWS} progress rows, "
    f"{MAX_PLATFORM_STATE_ACTIVITY_ROWS} activity rows, and {MAX_PLATFORM_STATE_LAB_ROWS} lab submissions."
)
PLATFORM_STATE_IMPORT_DESCRIPTION = (
    "Imports a portable Platform Academy guest profile backup into the requested target guest profile. "
    "Unknown non-platform lessons and unknown lab slugs are ignored, valid platform lessons regain lesson-completion XP, "
    "and lab scores are recalculated from the imported workbook answers and checked items. "
    f"Payloads are bounded to {MAX_PLATFORM_STATE_PROGRESS_ROWS} progress rows, "
    f"{MAX_PLATFORM_STATE_ACTIVITY_ROWS} activity rows, {MAX_PLATFORM_STATE_LAB_ROWS} lab submissions, "
    f"{MAX_PLATFORM_STATE_WORKSHEET_FIELDS} worksheet fields per lab, {MAX_PLATFORM_STATE_CHECKED_FIELDS} checked fields per lab, "
    f"{MAX_PLATFORM_STATE_FIELD_KEY_LENGTH}-character field keys, and {MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH}-character answers."
)
PLATFORM_LAB_SUBMISSION_DESCRIPTION = (
    "Saves or returns a Platform Academy lab workbook for a guest learner. "
    f"Workbook payloads accept up to {MAX_PLATFORM_STATE_WORKSHEET_FIELDS} worksheet fields and "
    f"{MAX_PLATFORM_STATE_CHECKED_FIELDS} checked fields; field keys are capped at {MAX_PLATFORM_STATE_FIELD_KEY_LENGTH} characters "
    f"and worksheet answers at {MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH} characters. "
    "Scoring counts only the lab's advertised worksheet and validation item IDs, so stale or unknown client keys cannot inflate completion."
)
NO_STORE_OPENAPI_HEADERS = {
    "Cache-Control": {
        "description": "Always `no-store` for Platform Academy dynamic and download responses.",
        "schema": {"type": "string", "example": "no-store"},
    },
    "Pragma": {
        "description": "Always `no-cache` for Platform Academy dynamic and download responses.",
        "schema": {"type": "string", "example": "no-cache"},
    },
}
LAB_PACKET_DOWNLOAD_HEADERS = {
    **NO_STORE_OPENAPI_HEADERS,
    "Content-Disposition": {
        "description": "Attachment filename in the form `{lab_slug}-lab-packet.md`.",
        "schema": {"type": "string"},
    },
}
LAB_SOURCE_BUNDLE_DOWNLOAD_HEADERS = {
    **NO_STORE_OPENAPI_HEADERS,
    "Content-Disposition": {
        "description": "Attachment filename in the form `{lab_slug}-lab-bundle.zip`.",
        "schema": {"type": "string"},
    },
}
LAB_WORKSPACE_BUNDLE_DOWNLOAD_HEADERS = {
    **NO_STORE_OPENAPI_HEADERS,
    "Content-Disposition": {
        "description": "Attachment filename in the form `{lab_slug}-learner-workspace.zip`.",
        "schema": {"type": "string"},
    },
}

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

request_windows: dict[str, deque[float]] = defaultdict(deque)
RATE_LIMIT_WINDOW_SECONDS = 60
NO_STORE_PATH_PREFIXES = (
    "/api/platform-academy",
    "/api/users",
    "/api/progress",
    "/api/learning-path",
    "/api/reviews",
    "/api/quiz",
)

DAILY_GOAL_XP = 50
PLATFORM_ACTIVITY_METRIC_TARGET_TYPES = {"guest_recovery", "interview_question", "lab", "resource"}
PLATFORM_ACTIVITY_METRIC_STATES = {"completed", "in_progress", "review", "started"}
PLATFORM_LAB_SUBMISSION_METRIC_STATUSES = {"in_progress", "submitted"}

LAB_FEEDBACK_STOPWORDS = {
    "about",
    "after",
    "against",
    "before",
    "between",
    "because",
    "cleanup",
    "command",
    "commands",
    "confirm",
    "contains",
    "current",
    "expected",
    "evidence",
    "fails",
    "fixed",
    "from",
    "have",
    "into",
    "local",
    "manifest",
    "manifests",
    "needed",
    "output",
    "review",
    "should",
    "state",
    "starts",
    "that",
    "this",
    "until",
    "validation",
    "with",
    "without",
}


def lab_artifact_root() -> Path:
    candidates = [Path.cwd()]
    resolved_file = Path(__file__).resolve()
    candidates.extend(parent for parent in resolved_file.parents if parent != parent.parent)
    for candidate in candidates:
        if (candidate / "labs" / "platform-academy").is_dir():
            return candidate
    return Path.cwd()


def require_source_bundle_access(
    source_bundle_token: str | None = Header(
        default=None,
        alias=SOURCE_BUNDLE_TOKEN_HEADER,
        description=(
            "Instructor/source bundle token. Required outside local/test/development; "
            "`PLATFORM_SOURCE_BUNDLE_PUBLIC=true` is rejected outside those environments."
        ),
    ),
) -> None:
    if settings.environment.lower() in LOCAL_SOURCE_BUNDLE_ENVIRONMENTS:
        return

    expected_token = (settings.platform_source_bundle_token or "").strip()
    if expected_token and source_bundle_token and compare_digest(source_bundle_token, expected_token):
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="source bundle requires an instructor token")


ACHIEVEMENTS = [
    {
        "code": "first_lesson",
        "title": "First Lesson",
        "description": "Complete one lesson.",
        "target": 1,
        "domains": {"all", "zhongwen", "platform"},
    },
    {
        "code": "poetry_explorer",
        "title": "Poetry Explorer",
        "description": "Complete a literature or Tang poetry lesson.",
        "target": 1,
        "domains": {"all", "zhongwen"},
    },
    {
        "code": "character_builder",
        "title": "Character Builder",
        "description": "Complete a character building lesson or review character cards.",
        "target": 1,
        "domains": {"all", "zhongwen"},
    },
    {
        "code": "seven_day_streak",
        "title": "Seven Day Streak",
        "description": "Record learner XP on seven consecutive days.",
        "target": 7,
        "domains": {"all", "zhongwen", "platform"},
    },
    {
        "code": "platform_pathfinder",
        "title": "Platform Pathfinder",
        "description": "Complete a Platform Academy lesson.",
        "target": 1,
        "domains": {"all", "platform"},
    },
    {
        "code": "resource_curator",
        "title": "Resource Curator",
        "description": "Save a Platform Academy resource review.",
        "target": 1,
        "domains": {"all", "platform"},
    },
    {
        "code": "interview_operator",
        "title": "Interview Operator",
        "description": "Practice a Platform Academy interview question.",
        "target": 1,
        "domains": {"all", "platform"},
    },
    {
        "code": "cluster_debugger",
        "title": "Cluster Debugger",
        "description": "Save or submit a full Platform Academy lab workbook.",
        "target": 1,
        "domains": {"all", "platform"},
    },
]


def ensure_user(db: Session, user_id: str) -> None:
    if not user_id or len(user_id) > MAX_USER_ID_LENGTH or not re.fullmatch(USER_ID_PATTERN, user_id):
        raise HTTPException(
            status_code=422,
            detail="user_id must be 1-80 characters and contain only letters, numbers, dot, underscore, colon, and hyphen",
        )
    if db.get(User, user_id):
        return
    try:
        with db.begin_nested():
            db.add(User(id=user_id, display_name=user_id, subscription_status="mock_active"))
            db.flush()
    except IntegrityError:
        if not db.get(User, user_id):
            raise


def find_progress(db: Session, user_id: str, lesson_id: int) -> Progress | None:
    return db.query(Progress).filter(Progress.user_id == user_id, Progress.lesson_id == lesson_id).first()


def get_or_create_progress(db: Session, user_id: str, lesson_id: int) -> Progress:
    progress = find_progress(db, user_id, lesson_id)
    if progress:
        return progress
    try:
        with db.begin_nested():
            progress = Progress(user_id=user_id, lesson_id=lesson_id)
            db.add(progress)
            db.flush()
        return progress
    except IntegrityError:
        progress = find_progress(db, user_id, lesson_id)
        if not progress:
            raise
        return progress


def find_review_state(db: Session, user_id: str, flashcard_id: int) -> ReviewState | None:
    return db.query(ReviewState).filter(ReviewState.user_id == user_id, ReviewState.flashcard_id == flashcard_id).first()


def get_or_create_review_state(db: Session, user_id: str, flashcard_id: int) -> ReviewState:
    state = find_review_state(db, user_id, flashcard_id)
    if state:
        return state
    try:
        with db.begin_nested():
            state = ReviewState(user_id=user_id, flashcard_id=flashcard_id, ease=2.5, interval_days=0, due_at=utc_now())
            db.add(state)
            db.flush()
        return state
    except IntegrityError:
        state = find_review_state(db, user_id, flashcard_id)
        if not state:
            raise
        return state


def add_xp_event(db: Session, user_id: str, source: str, source_id: int, xp: int) -> None:
    existing = db.query(XpEvent).filter(XpEvent.user_id == user_id, XpEvent.source == source, XpEvent.source_id == source_id).first()
    if existing:
        return
    try:
        with db.begin_nested():
            db.add(XpEvent(user_id=user_id, source=source, source_id=source_id, xp=xp))
            db.flush()
        XP_AWARDED.labels(source=source).inc(xp)
    except IntegrityError:
        existing = db.query(XpEvent).filter(XpEvent.user_id == user_id, XpEvent.source == source, XpEvent.source_id == source_id).first()
        if not existing:
            raise


def selected_domain(domain: str | None) -> str:
    selected = (domain or "all").lower()
    if selected not in {"all", "platform", "zhongwen"}:
        raise HTTPException(status_code=400, detail="domain must be one of: all, zhongwen, platform")
    return selected


def bounded_metric_label(value: str, allowed_values: set[str]) -> str:
    return value if value in allowed_values else "other"


def course_domain_condition(domain: str | None):
    selected = selected_domain(domain)
    if selected == "all":
        return None
    if selected == "platform":
        return Course.era == PLATFORM_ACADEMY_ERA
    return Course.era != PLATFORM_ACADEMY_ERA


def completed_progress_query(db: Session, user_id: str, domain: str = "all"):
    query = db.query(Progress).join(Lesson, Progress.lesson_id == Lesson.id).join(Course, Lesson.course_id == Course.id).filter(
        Progress.user_id == user_id,
        Progress.completed.is_(True),
    )
    condition = course_domain_condition(domain)
    if condition is not None:
        query = query.filter(condition)
    return query


def current_streak_days(activity_dates: set[date]) -> int:
    if not activity_dates:
        return 0
    cursor = utc_today()
    streak = 0
    while cursor in activity_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def due_review_count(db: Session, user_id: str, domain: str = "all") -> int:
    now = utc_now()
    query = db.query(Flashcard.id).join(Lesson, Flashcard.lesson_id == Lesson.id).join(Course, Lesson.course_id == Course.id)
    condition = course_domain_condition(domain)
    if condition is not None:
        query = query.filter(condition)
    cards = query.all()
    count = 0
    for (flashcard_id,) in cards:
        state = find_review_state(db, user_id, flashcard_id)
        if not state or state.due_at <= now:
            count += 1
    return count


def apply_course_domain_filter(query, domain: str | None):
    selected = selected_domain(domain)
    if selected == "all":
        return query
    if selected == "platform":
        return query.filter(Course.era == PLATFORM_ACADEMY_ERA)
    if selected == "zhongwen":
        return query.filter(Course.era != PLATFORM_ACADEMY_ERA)


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


def platform_lesson_ids(db: Session) -> set[int]:
    return {
        lesson_id
        for (lesson_id,) in db.query(Lesson.id)
        .join(Course, Lesson.course_id == Course.id)
        .filter(Course.era == PLATFORM_ACADEMY_ERA)
        .all()
    }


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
                "lab_tier": lab.get("lab_tier", "guided"),
                "portfolio_grade": lab.get("portfolio_grade", False),
                "portfolio_focus": lab.get("portfolio_focus", ""),
                "scenario": lab["scenario"],
                "skills": lab["skills"],
                "prerequisites": lab.get("prerequisites", []),
                "setup_commands": lab.get("setup_commands", []),
                "setup_self_check_commands": lab.get("setup_self_check_commands", []),
                "commands": lab["commands"],
                "practice_steps": lab.get("practice_steps", []),
                "expected_evidence": lab.get("expected_evidence", []),
                "validation_commands": lab.get("validation_commands", []),
                "cleanup_commands": lab.get("cleanup_commands", []),
                "no_cluster_fallback": lab.get("no_cluster_fallback", []),
                "artifact_paths": learner_artifact_paths(lab),
                "learner_artifact_paths": learner_artifact_paths(lab),
                "workspace_archive_name": lab.get("workspace_archive_name", ""),
                "workspace_root": lab.get("workspace_root", ""),
                "workspace_quickstart_commands": lab.get("workspace_quickstart_commands", []),
                "cluster_workspace_commands": cluster_workspace_commands(lab),
                "worksheet_prompts": lab.get("worksheet_prompts", []),
                "rubric": lab.get("rubric", []),
                "validation_checks": lab.get("validation_checks", []),
                "checklist": lab["checklist"],
                "course_slug": lab["course_slug"],
                "lesson_id": lesson_id,
            }
        )
    return labs


def platform_lab_by_slug(lab_slug: str) -> dict:
    lab = next((item for item in PLATFORM_LABS if item["slug"] == lab_slug), None)
    if not lab:
        raise HTTPException(status_code=404, detail="lab not found")
    return lab


def normalized_lab_feedback_text(value: str) -> str:
    return value.lower().replace("_", "-")


def lab_feedback_source_strings(value) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return [value]
    if isinstance(value, dict):
        strings: list[str] = []
        for item in value.values():
            strings.extend(lab_feedback_source_strings(item))
        return strings
    if isinstance(value, (list, tuple, set)):
        strings = []
        for item in value:
            strings.extend(lab_feedback_source_strings(item))
        return strings
    return [str(value)]


def platform_lab_feedback_terms(lab: dict) -> list[str]:
    sources: list[str] = []
    sources.extend(learner_artifact_paths(lab))
    for key in [
        "scenario",
        "skills",
        "expected_evidence",
        "validation_commands",
        "commands",
        "worksheet_prompts",
        "rubric",
        "validation_checks",
        "rubric_evidence_terms",
    ]:
        sources.extend(lab_feedback_source_strings(lab.get(key, [])))
    terms: set[str] = set()
    for source in sources:
        for token in re.findall(r"[a-zA-Z0-9][a-zA-Z0-9./:_=-]{2,}", source.lower()):
            token = token.strip("./:_=-")
            if token and (len(token) >= 4 or token in {"app", "pod", "svc"}) and token not in LAB_FEEDBACK_STOPWORDS:
                terms.add(token)
    return sorted(terms, key=lambda item: (-len(item), item))


def platform_lab_rubric_evidence_terms(lab: dict, index: int) -> list[str]:
    terms_by_rubric = lab.get("rubric_evidence_terms", [])
    if not isinstance(terms_by_rubric, list) or index >= len(terms_by_rubric):
        return []
    terms = []
    seen = set()
    for term in lab_feedback_source_strings(terms_by_rubric[index]):
        normalized = normalized_lab_feedback_text(term.strip())
        if normalized and normalized not in seen:
            terms.append(normalized)
            seen.add(normalized)
    return terms


def platform_lab_tracked_check_ids(lab: dict) -> set[str]:
    worksheet_count = len(lab.get("worksheet_prompts", []))
    validation_count = len(lab.get("validation_checks", []))
    return {f"worksheet-{index}" for index in range(worksheet_count)} | {
        f"validation-{index}" for index in range(validation_count)
    }


def platform_lab_answered_prompt_count(lab: dict, worksheet_answers: dict) -> int:
    total_prompts = len(lab.get("worksheet_prompts", []))
    return sum(1 for index in range(total_prompts) if str(worksheet_answers.get(f"worksheet-{index}", "")).strip())


def platform_lab_completed_check_count(lab: dict, checked_items: dict) -> int:
    return sum(1 for item_id in platform_lab_tracked_check_ids(lab) if checked_items.get(item_id))


def platform_lab_feedback(lab: dict, checked_items: dict, worksheet_answers: dict) -> tuple[list[str], list[dict]]:
    worksheet_items = lab.get("worksheet_prompts", [])
    validation_items = lab.get("validation_checks", [])
    rubric_items = lab.get("rubric", [])
    total_prompts = len(worksheet_items)
    total_validation = len(validation_items)
    answer_text = "\n".join(str(value) for value in worksheet_answers.values() if str(value).strip())
    normalized_answer = normalized_lab_feedback_text(answer_text)
    answered_prompts = platform_lab_answered_prompt_count(lab, worksheet_answers)
    completed_validation = sum(1 for index in range(total_validation) if checked_items.get(f"validation-{index}"))
    completed_checks = platform_lab_completed_check_count(lab, checked_items)
    matched_terms = [term for term in platform_lab_feedback_terms(lab) if term and term in normalized_answer]
    action_terms = {
        "apply",
        "block",
        "cleanup",
        "decision",
        "escalate",
        "fix",
        "fixed",
        "owner",
        "risk",
        "rollback",
        "validate",
    }
    has_action = any(term in normalized_answer for term in action_terms)
    has_safety = any(term in normalized_answer for term in {"local", "sandbox", "dry-run", "no-cluster", "cleanup", "shared", "production"})

    def rubric_specific_feedback(index: int, specific_terms: list[str]) -> tuple[str, str, list[str]]:
        matched_specific = [term for term in specific_terms if term in normalized_answer]
        answered_for_criterion = bool(str(worksheet_answers.get(f"worksheet-{index}", "")).strip())
        if answered_prompts == 0:
            return "missing", "Add workbook notes before this criterion can be evaluated.", []

        pass_threshold = 1 if len(specific_terms) <= 2 else 2
        strong_threshold = max(pass_threshold, min(len(specific_terms), 3))
        completion_criterion = index >= len(rubric_items) - 1 or any(
            term in {"cleanup", "fallback", "handoff", "rollout", "validate", "validation"} for term in specific_terms
        )

        if len(matched_specific) >= strong_threshold:
            if completion_criterion and total_validation and completed_validation < total_validation:
                return (
                    "passes",
                    "The evidence is present; mark the matching validation or cleanup checks when the run is complete.",
                    matched_specific[:6],
                )
            return "strong", "This criterion cites the expected lab-specific evidence.", matched_specific[:6]
        if len(matched_specific) >= pass_threshold:
            missing = [term for term in specific_terms if term not in matched_specific][:3]
            return (
                "passes",
                f"Evidence is present; add {', '.join(missing)} for a stronger note." if missing else "Evidence is present.",
                matched_specific[:5],
            )
        if matched_specific:
            missing = [term for term in specific_terms if term not in matched_specific][:3]
            return (
                "needs-evidence",
                f"Add more specific evidence for this criterion, especially {', '.join(missing)}.",
                matched_specific[:3],
            )
        if answered_for_criterion:
            return "needs-evidence", "This answer is present but does not cite the expected lab-specific evidence.", []
        return "missing", "Add an answer for this criterion and cite the expected command output or file excerpt.", []

    def status_feedback(index: int) -> tuple[str, str, list[str]]:
        specific_terms = platform_lab_rubric_evidence_terms(lab, index)
        if specific_terms:
            return rubric_specific_feedback(index, specific_terms)
        if index == 0:
            if answered_prompts == 0:
                return "missing", "Add a note that names the starting state, scope, or safety boundary.", []
            if has_safety or len(answer_text) >= 80:
                return "strong", "Starting state is documented with enough context to guide a safe run.", matched_terms[:4]
            return "passes", "Starting state is present; add scope or safety boundary detail for a stronger note.", matched_terms[:3]
        if index == 1:
            if len(matched_terms) >= 4:
                return "strong", "The note names multiple lab-specific evidence terms.", matched_terms[:6]
            if len(matched_terms) >= 2:
                return "passes", "The note includes concrete evidence, but could cite one more command or file signal.", matched_terms[:4]
            if answered_prompts:
                return "needs-evidence", "The note is present but does not cite enough lab-specific evidence.", matched_terms[:2]
            return "missing", "Capture command output, file excerpts, or expected evidence before marking this done.", []
        if index == 2:
            if has_action and len(matched_terms) >= 2:
                return "strong", "The decision includes action language and ties back to evidence.", matched_terms[:5]
            if has_action or len(answer_text) >= 100:
                return (
                    "passes",
                    "A decision is present; connect it to owner, risk, validation, or rollback to improve it.",
                    matched_terms[:3],
                )
            return "needs-evidence", "Add the smallest safe action, owner, risk, validation, or rollback path.", matched_terms[:2]
        if completed_validation == total_validation and total_validation > 0 and completed_checks >= total_prompts + total_validation:
            return "strong", "All worksheet and validation checks are marked complete.", matched_terms[:4]
        if completed_validation > 0:
            return "passes", "Some validation is complete; finish remaining checks or document the fallback path.", matched_terms[:3]
        return "missing", "Run validation, cleanup, or no-cluster fallback and mark the matching checks.", []

    feedback = []
    for index, criterion in enumerate(rubric_items):
        status, message, terms = status_feedback(index)
        feedback.append({"criterion": criterion, "status": status, "feedback": message, "evidence_terms": terms})
    return matched_terms[:10], feedback


def platform_lab_submission_payload(submission: PlatformLabSubmission, lab: dict) -> dict:
    worksheet_answers = submission.worksheet_answers or {}
    checked_items = submission.checked_items or {}
    total_prompts = len(lab.get("worksheet_prompts", []))
    total_checks = total_prompts + len(lab.get("validation_checks", []))
    answered_prompts = platform_lab_answered_prompt_count(lab, worksheet_answers)
    completed_checks = platform_lab_completed_check_count(lab, checked_items)
    evidence_terms, rubric_feedback = platform_lab_feedback(lab, checked_items, worksheet_answers)
    return {
        "id": submission.id,
        "user_id": submission.user_id,
        "lab_slug": submission.lab_slug,
        "worksheet_answers": worksheet_answers,
        "checked_items": checked_items,
        "status": submission.status,
        "score": submission.score,
        "completed_checks": completed_checks,
        "total_checks": total_checks,
        "answered_prompts": answered_prompts,
        "total_prompts": total_prompts,
        "evidence_terms": evidence_terms,
        "rubric_feedback": rubric_feedback,
        "created_at": submission.created_at,
        "updated_at": submission.updated_at,
    }


def find_platform_activity(db: Session, user_id: str, target_type: str, target_id: str) -> PlatformActivity | None:
    return (
        db.query(PlatformActivity)
        .filter(
            PlatformActivity.user_id == user_id,
            PlatformActivity.target_type == target_type,
            PlatformActivity.target_id == target_id,
        )
        .first()
    )


def get_or_create_platform_activity(db: Session, user_id: str, target_type: str, target_id: str) -> PlatformActivity:
    activity = find_platform_activity(db, user_id, target_type, target_id)
    if activity:
        return activity
    try:
        with db.begin_nested():
            activity = PlatformActivity(user_id=user_id, target_type=target_type, target_id=target_id)
            db.add(activity)
            db.flush()
        return activity
    except IntegrityError:
        activity = find_platform_activity(db, user_id, target_type, target_id)
        if not activity:
            raise
        return activity


def find_platform_lab_submission(db: Session, user_id: str, lab_slug: str) -> PlatformLabSubmission | None:
    return (
        db.query(PlatformLabSubmission)
        .filter(PlatformLabSubmission.user_id == user_id, PlatformLabSubmission.lab_slug == lab_slug)
        .first()
    )


def get_or_create_platform_lab_submission(
    db: Session,
    user_id: str,
    lab_slug: str,
    defaults: dict | None = None,
) -> PlatformLabSubmission:
    submission = find_platform_lab_submission(db, user_id, lab_slug)
    if submission:
        return submission
    try:
        with db.begin_nested():
            submission = PlatformLabSubmission(user_id=user_id, lab_slug=lab_slug, **(defaults or {}))
            db.add(submission)
            db.flush()
        return submission
    except IntegrityError:
        submission = find_platform_lab_submission(db, user_id, lab_slug)
        if not submission:
            raise
        return submission


def score_platform_lab_submission(lab: dict, checked_items: dict, worksheet_answers: dict) -> float:
    total_prompts = len(lab.get("worksheet_prompts", []))
    total_checks = total_prompts + len(lab.get("validation_checks", []))
    answered_prompts = platform_lab_answered_prompt_count(lab, worksheet_answers)
    completed_checks = platform_lab_completed_check_count(lab, checked_items)
    total_units = total_checks + total_prompts
    if total_units == 0:
        return 0
    return round(((completed_checks + answered_prompts) / total_units) * 100, 2)


def parse_trusted_proxy_networks() -> list:
    networks = []
    for value in settings.trusted_proxy_cidrs.split(","):
        cidr = value.strip()
        if not cidr:
            continue
        try:
            networks.append(ip_network(cidr, strict=False))
        except ValueError:
            logger.warning("invalid_trusted_proxy_cidr", extra={"trusted_proxy_cidr": cidr})
    return networks


def is_trusted_proxy(host: str | None) -> bool:
    if not host:
        return False
    try:
        peer_ip = ip_address(host)
    except ValueError:
        return False
    return any(peer_ip in network for network in parse_trusted_proxy_networks())


def first_forwarded_ip(value: str | None) -> str | None:
    if not value:
        return None
    for item in value.split(","):
        candidate = item.strip()
        if not candidate:
            continue
        try:
            return str(ip_address(candidate))
        except ValueError:
            continue
    return None


def resolved_client_ip_from_headers(peer_host: str | None, forwarded_for: str | None, real_ip_header: str | None) -> str:
    if is_trusted_proxy(peer_host):
        forwarded_for = first_forwarded_ip(forwarded_for)
        if forwarded_for:
            return forwarded_for
        real_ip = first_forwarded_ip(real_ip_header)
        if real_ip:
            return real_ip
    return peer_host or "unknown"


def resolved_client_ip(request: Request) -> str:
    return resolved_client_ip_from_headers(
        request.client.host if request.client else None,
        request.headers.get("x-forwarded-for"),
        request.headers.get("x-real-ip"),
    )


def should_rate_limit(path: str) -> bool:
    if settings.rate_limit_per_minute <= 0:
        return False
    return path not in settings.rate_limit_exempt_path_set


def should_disable_cache(path: str) -> bool:
    return any(path == prefix or path.startswith(f"{prefix}/") for prefix in NO_STORE_PATH_PREFIXES)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid4()))
    request.state.request_id = request_id
    client_ip = resolved_client_ip(request)
    request.state.client_ip = client_ip

    if should_rate_limit(request.url.path):
        now = time.time()
        window = request_windows[client_ip]
        while window and now - window[0] > RATE_LIMIT_WINDOW_SECONDS:
            window.popleft()
        if len(window) >= settings.rate_limit_per_minute:
            ERROR_COUNT.labels(path=request.url.path).inc()
            return Response(
                "rate limit exceeded",
                status_code=429,
                headers={
                    "x-request-id": request_id,
                    "retry-after": str(RATE_LIMIT_WINDOW_SECONDS),
                    "x-rate-limit-limit": str(settings.rate_limit_per_minute),
                    "x-rate-limit-remaining": "0",
                },
            )
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
    if should_disable_cache(request.url.path):
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
    REQUEST_COUNT.labels(request.method, request.url.path, str(response.status_code)).inc()
    REQUEST_LATENCY.labels(request.method, request.url.path).observe(duration)
    logger.info(
        "request_complete",
        extra={
            "request_id": request_id,
            "client_ip": client_ip,
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
        "promise": "Practice Kubernetes, EKS, Helm, ArgoCD, and SRE with local lessons, labs, resources, and interview drills.",
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


@app.get(
    "/api/platform-academy/labs/{lab_slug}/packet",
    response_class=Response,
    summary="Get Platform Academy Lab Packet",
    responses={
        200: {
            "description": "Markdown worksheet packet for the selected Platform Academy lab.",
            "content": {"text/markdown": {"schema": {"type": "string"}}},
            "headers": LAB_PACKET_DOWNLOAD_HEADERS,
        }
    },
)
def get_platform_academy_lab_packet(lab_slug: str):
    lab = platform_lab_by_slug(lab_slug)
    PLATFORM_LAB_PACKET_DOWNLOADS.labels(lab_slug=lab_slug).inc()
    return Response(
        content=lab_packet_markdown(lab),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{lab_slug}-lab-packet.md"'},
    )


@app.get(
    "/api/platform-academy/labs/{lab_slug}/bundle",
    response_class=Response,
    summary="Get Platform Academy Instructor Source Bundle",
    responses={
        200: {
            "description": "Zip archive containing the selected Platform Academy lab packet and complete source artifacts.",
            "content": {"application/zip": {"schema": {"type": "string", "format": "binary"}}},
            "headers": LAB_SOURCE_BUNDLE_DOWNLOAD_HEADERS,
        },
        403: {
            "description": "Non-local deployments require an instructor source-bundle token.",
            "headers": NO_STORE_OPENAPI_HEADERS,
        },
    },
)
def get_platform_academy_lab_bundle(lab_slug: str, _: None = Depends(require_source_bundle_access)):
    lab = platform_lab_by_slug(lab_slug)

    root = lab_artifact_root().resolve()
    bundle = BytesIO()
    try:
        with ZipFile(bundle, "w", compression=ZIP_DEFLATED) as archive:
            write_source_bundle_archive(archive, lab, root)
    except LabArtifactError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    PLATFORM_LAB_BUNDLE_DOWNLOADS.labels(lab_slug=lab_slug).inc()
    return Response(
        content=bundle.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{lab_slug}-lab-bundle.zip"'},
    )


@app.get(
    "/api/platform-academy/labs/{lab_slug}/workspace-bundle",
    response_class=Response,
    summary="Get Platform Academy Learner Workspace Bundle",
    responses={
        200: {
            "description": "Zip archive containing a learner-safe workspace without solution artifacts.",
            "content": {"application/zip": {"schema": {"type": "string", "format": "binary"}}},
            "headers": LAB_WORKSPACE_BUNDLE_DOWNLOAD_HEADERS,
        }
    },
)
def get_platform_academy_lab_workspace_bundle(lab_slug: str):
    lab = platform_lab_by_slug(lab_slug)

    root = lab_artifact_root().resolve()
    bundle = BytesIO()
    try:
        with ZipFile(bundle, "w", compression=ZIP_DEFLATED) as archive:
            write_learner_workspace_archive(archive, lab, root)
    except LabArtifactError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    PLATFORM_LAB_BUNDLE_DOWNLOADS.labels(lab_slug=lab_slug).inc()
    return Response(
        content=bundle.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{lab_slug}-learner-workspace.zip"'},
    )


@app.get("/api/platform-academy/resources", response_model=PlatformResourcesOut)
def get_platform_academy_resources():
    return {
        "domains": sorted({resource["domain"] for resource in PLATFORM_RESOURCES}),
        "types": sorted({resource["resource_type"] for resource in PLATFORM_RESOURCES}),
        "resources": PLATFORM_RESOURCES,
    }


@app.get("/api/platform-academy/interview-prep", response_model=PlatformInterviewPrepIndexOut)
def get_platform_academy_interview_prep():
    return {
        "domains": sorted({pack["domain"] for pack in PLATFORM_INTERVIEW_PREP}),
        "levels": sorted({pack["level_group"] for pack in PLATFORM_INTERVIEW_PREP}),
        "total_questions": sum(len(pack["questions"]) for pack in PLATFORM_INTERVIEW_PREP),
        "packs": PLATFORM_INTERVIEW_PREP,
    }


@app.get(
    "/api/platform-academy/state/{user_id}/export",
    response_model=PlatformLearnerStateExport,
    summary="Export Platform Academy learner state",
    description=PLATFORM_STATE_EXPORT_DESCRIPTION,
    response_description="Portable Platform Academy learner-state backup.",
    tags=["Platform Academy"],
)
def export_platform_learner_state(user_id: str, db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    lesson_ids = platform_lesson_ids(db)
    lab_slugs = {lab["slug"] for lab in PLATFORM_LABS}
    progress_rows = (
        db.query(Progress)
        .filter(Progress.user_id == user_id, Progress.lesson_id.in_(lesson_ids))
        .order_by(Progress.updated_at.desc())
        .limit(MAX_PLATFORM_STATE_PROGRESS_ROWS)
        .all()
    )
    activity_rows = (
        db.query(PlatformActivity)
        .filter(PlatformActivity.user_id == user_id)
        .order_by(PlatformActivity.updated_at.desc())
        .limit(MAX_PLATFORM_STATE_ACTIVITY_ROWS)
        .all()
    )
    lab_rows = (
        db.query(PlatformLabSubmission)
        .filter(PlatformLabSubmission.user_id == user_id, PlatformLabSubmission.lab_slug.in_(lab_slugs))
        .order_by(PlatformLabSubmission.updated_at.desc())
        .limit(MAX_PLATFORM_STATE_LAB_ROWS)
        .all()
    )
    return {
        "schema_version": 1,
        "exported_at": utc_now(),
        "source_user_id": user_id,
        "progress": [
            {
                "lesson_id": row.lesson_id,
                "completed": row.completed,
                "score": row.score,
                "updated_at": row.updated_at,
            }
            for row in progress_rows
        ],
        "activity": [
            {
                "target_type": row.target_type,
                "target_id": row.target_id,
                "state": row.state,
                "updated_at": row.updated_at,
            }
            for row in activity_rows
        ],
        "lab_submissions": [
            {
                "lab_slug": row.lab_slug,
                "worksheet_answers": row.worksheet_answers or {},
                "checked_items": row.checked_items or {},
                "status": row.status,
                "updated_at": row.updated_at,
            }
            for row in lab_rows
        ],
    }


@app.post(
    "/api/platform-academy/state/import",
    response_model=PlatformLearnerStateImportOut,
    summary="Import Platform Academy learner state",
    description=PLATFORM_STATE_IMPORT_DESCRIPTION,
    response_description="Counts for imported progress, activity, and lab submission rows.",
    responses={422: {"description": "Payload fails schema version, size, or field-length validation."}},
    tags=["Platform Academy"],
)
def import_platform_learner_state(payload: PlatformLearnerStateImportIn, db: Session = Depends(get_db)):
    ensure_user(db, payload.target_user_id)
    lesson_ids = platform_lesson_ids(db)
    labs_by_slug = {lab["slug"]: lab for lab in PLATFORM_LABS}

    progress_imported = 0
    for item in payload.state.progress:
        if item.lesson_id not in lesson_ids:
            continue
        progress = get_or_create_progress(db, payload.target_user_id, item.lesson_id)
        progress.completed = item.completed
        progress.score = item.score
        db.flush()
        if item.completed:
            add_xp_event(db, payload.target_user_id, "lesson_completion", item.lesson_id, 20)
        progress_imported += 1

    activity_imported = 0
    for item in payload.state.activity:
        activity = get_or_create_platform_activity(db, payload.target_user_id, item.target_type, item.target_id)
        activity.state = item.state
        db.flush()
        activity_imported += 1

    lab_submissions_imported = 0
    for item in payload.state.lab_submissions:
        lab = labs_by_slug.get(item.lab_slug)
        if not lab:
            continue
        submission = get_or_create_platform_lab_submission(db, payload.target_user_id, item.lab_slug)
        worksheet_answers = {str(key): str(value) for key, value in item.worksheet_answers.items()}
        checked_items = {str(key): bool(value) for key, value in item.checked_items.items()}
        submission.worksheet_answers = worksheet_answers
        submission.checked_items = checked_items
        submission.status = item.status
        submission.score = score_platform_lab_submission(lab, checked_items, worksheet_answers)
        db.flush()
        lab_submissions_imported += 1

    db.commit()
    return {
        "user_id": payload.target_user_id,
        "progress_imported": progress_imported,
        "activity_imported": activity_imported,
        "lab_submissions_imported": lab_submissions_imported,
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
    progress = get_or_create_progress(db, payload.user_id, payload.lesson_id)
    was_completed = progress.completed
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


@app.post("/api/platform-academy/activity", response_model=PlatformActivityOut)
def upsert_platform_activity(payload: PlatformActivityIn, db: Session = Depends(get_db)):
    ensure_user(db, payload.user_id)
    activity = get_or_create_platform_activity(db, payload.user_id, payload.target_type, payload.target_id)
    activity.state = payload.state
    db.commit()
    db.refresh(activity)
    PLATFORM_ACTIVITY_SAVES.labels(
        target_type=bounded_metric_label(payload.target_type, PLATFORM_ACTIVITY_METRIC_TARGET_TYPES),
        state=bounded_metric_label(payload.state, PLATFORM_ACTIVITY_METRIC_STATES),
    ).inc()
    return activity


@app.get("/api/platform-academy/activity/{user_id}", response_model=list[PlatformActivityOut])
def get_platform_activity(user_id: str, db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    return db.query(PlatformActivity).filter(PlatformActivity.user_id == user_id).order_by(PlatformActivity.updated_at.desc()).all()


@app.get(
    "/api/platform-academy/lab-submissions/{user_id}",
    response_model=list[PlatformLabSubmissionOut],
    summary="List Platform Academy lab submissions",
    description="Returns scored saved lab workbooks for a guest learner, newest first.",
    tags=["Platform Academy"],
)
def get_platform_lab_submissions(user_id: str, db: Session = Depends(get_db)):
    ensure_user(db, user_id)
    labs_by_slug = {lab["slug"]: lab for lab in PLATFORM_LABS}
    submissions = (
        db.query(PlatformLabSubmission)
        .filter(PlatformLabSubmission.user_id == user_id)
        .order_by(PlatformLabSubmission.updated_at.desc())
        .all()
    )
    return [
        platform_lab_submission_payload(submission, labs_by_slug[submission.lab_slug])
        for submission in submissions
        if submission.lab_slug in labs_by_slug
    ]


@app.get(
    "/api/platform-academy/labs/{lab_slug}/submission/{user_id}",
    response_model=PlatformLabSubmissionOut,
    summary="Get a Platform Academy lab workbook",
    description=PLATFORM_LAB_SUBMISSION_DESCRIPTION,
    tags=["Platform Academy"],
)
def get_platform_lab_submission(lab_slug: str, user_id: str, db: Session = Depends(get_db)):
    lab = platform_lab_by_slug(lab_slug)
    ensure_user(db, user_id)
    submission = get_or_create_platform_lab_submission(
        db,
        user_id,
        lab_slug,
        {"worksheet_answers": {}, "checked_items": {}, "score": 0},
    )
    db.commit()
    db.refresh(submission)
    return platform_lab_submission_payload(submission, lab)


@app.post(
    "/api/platform-academy/labs/{lab_slug}/submission",
    response_model=PlatformLabSubmissionOut,
    summary="Save a Platform Academy lab workbook",
    description=PLATFORM_LAB_SUBMISSION_DESCRIPTION,
    response_description="Scored lab workbook with deterministic rubric feedback.",
    responses={422: {"description": "Payload fails workbook size or field-length validation."}},
    tags=["Platform Academy"],
)
def upsert_platform_lab_submission(lab_slug: str, payload: PlatformLabSubmissionIn, db: Session = Depends(get_db)):
    lab = platform_lab_by_slug(lab_slug)
    ensure_user(db, payload.user_id)
    submission = get_or_create_platform_lab_submission(db, payload.user_id, lab_slug)

    worksheet_answers = {str(key): str(value) for key, value in payload.worksheet_answers.items()}
    checked_items = {str(key): bool(value) for key, value in payload.checked_items.items()}
    submission.worksheet_answers = worksheet_answers
    submission.checked_items = checked_items
    submission.status = payload.status
    submission.score = score_platform_lab_submission(lab, checked_items, worksheet_answers)
    db.commit()
    db.refresh(submission)
    PLATFORM_LAB_SUBMISSIONS.labels(
        lab_slug=lab_slug,
        status=bounded_metric_label(payload.status, PLATFORM_LAB_SUBMISSION_METRIC_STATUSES),
    ).inc()
    return platform_lab_submission_payload(submission, lab)


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


def dashboard_xp_events(db: Session, user_id: str, domain: str = "all") -> list[XpEvent]:
    selected = selected_domain(domain)
    if selected == "all":
        return db.query(XpEvent).filter(XpEvent.user_id == user_id).order_by(XpEvent.created_at.desc()).all()

    condition = course_domain_condition(selected)
    lesson_ids = {
        lesson_id
        for (lesson_id,) in db.query(Lesson.id)
        .join(Course, Lesson.course_id == Course.id)
        .filter(condition)
        .all()
    }
    flashcard_ids = {
        flashcard_id
        for (flashcard_id,) in db.query(Flashcard.id)
        .join(Lesson, Flashcard.lesson_id == Lesson.id)
        .join(Course, Lesson.course_id == Course.id)
        .filter(condition)
        .all()
    }
    quiz_attempt_ids = {
        attempt_id
        for (attempt_id,) in db.query(QuizAttempt.id)
        .join(Lesson, QuizAttempt.lesson_id == Lesson.id)
        .join(Course, Lesson.course_id == Course.id)
        .filter(QuizAttempt.user_id == user_id, condition)
        .all()
    }

    event_filters = []
    if lesson_ids:
        event_filters.append((XpEvent.source == "lesson_completion") & XpEvent.source_id.in_(lesson_ids))
    if quiz_attempt_ids:
        event_filters.append((XpEvent.source == "quiz_attempt") & XpEvent.source_id.in_(quiz_attempt_ids))
    if flashcard_ids:
        event_filters.append((XpEvent.source == "srs_review") & XpEvent.source_id.in_(flashcard_ids))
    if not event_filters:
        return []
    return db.query(XpEvent).filter(XpEvent.user_id == user_id, or_(*event_filters)).order_by(XpEvent.created_at.desc()).all()


def achievement_progress(db: Session, user_id: str, streak_days: int, domain: str = "all") -> dict[str, int]:
    completed = completed_progress_query(db, user_id, domain).all()
    platform_completed = completed if domain == "platform" else completed_progress_query(db, user_id, "platform").all()
    completed_count = len(completed)
    poetry_count = sum(
        1
        for progress in completed
        if progress.lesson.course.category == "Literature" or progress.lesson.course.era == "Tang"
    )
    character_progress = sum(1 for progress in completed if progress.lesson.course.category == "Characters")
    review_query = (
        db.query(ReviewState)
        .join(Flashcard, ReviewState.flashcard_id == Flashcard.id)
        .join(Lesson, Flashcard.lesson_id == Lesson.id)
        .join(Course, Lesson.course_id == Course.id)
    )
    condition = course_domain_condition(domain)
    if condition is not None:
        review_query = review_query.filter(condition)
    character_reviews = review_query.filter(ReviewState.user_id == user_id, ReviewState.last_reviewed_at.is_not(None)).count()
    platform_activity = (
        db.query(PlatformActivity)
        .filter(PlatformActivity.user_id == user_id, PlatformActivity.state == "completed")
        .all()
    )
    submitted_lab_slugs = {
        submission.lab_slug
        for submission in db.query(PlatformLabSubmission)
        .filter(
            PlatformLabSubmission.user_id == user_id,
            PlatformLabSubmission.lab_slug.in_({lab["slug"] for lab in PLATFORM_LABS}),
            or_(PlatformLabSubmission.status == "submitted", PlatformLabSubmission.score > 0),
        )
        .all()
    }
    return {
        "first_lesson": completed_count,
        "poetry_explorer": poetry_count,
        "character_builder": character_progress + character_reviews,
        "seven_day_streak": streak_days,
        "platform_pathfinder": len(platform_completed),
        "resource_curator": len({row.target_id for row in platform_activity if row.target_type == "resource"}),
        "interview_operator": len({row.target_id for row in platform_activity if row.target_type == "interview_question"}),
        "cluster_debugger": len(submitted_lab_slugs),
    }


def achievement_definitions_for_domain(domain: str) -> list[dict]:
    return [definition for definition in ACHIEVEMENTS if domain in definition["domains"]]


def award_earned_achievements(db: Session, user_id: str, progress_by_code: dict[str, int], domain: str = "all") -> list[dict]:
    existing = {achievement.code: achievement for achievement in db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()}
    response = []
    for definition in achievement_definitions_for_domain(domain):
        code = definition["code"]
        progress = progress_by_code.get(code, 0)
        target = definition["target"]
        earned = progress >= target
        awarded = existing.get(code)
        if earned and not awarded:
            try:
                with db.begin_nested():
                    awarded = UserAchievement(user_id=user_id, code=code)
                    db.add(awarded)
                    db.flush()
                existing[code] = awarded
                ACHIEVEMENTS_AWARDED.labels(code=code).inc()
            except IntegrityError:
                awarded = db.query(UserAchievement).filter(UserAchievement.user_id == user_id, UserAchievement.code == code).first()
                if not awarded:
                    raise
                existing[code] = awarded
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
def get_user_dashboard(user_id: str, domain: str = "all", db: Session = Depends(get_db)):
    dashboard_domain = selected_domain(domain)
    ensure_user(db, user_id)
    events = dashboard_xp_events(db, user_id, dashboard_domain)
    lesson_xp = sum(event.xp for event in events if event.source == "lesson_completion")
    quiz_xp = sum(event.xp for event in events if event.source == "quiz_attempt")
    review_xp = sum(event.xp for event in events if event.source == "srs_review")
    total_xp = sum(event.xp for event in events)
    today = utc_today()
    earned_today = sum(event.xp for event in events if event.created_at.date() == today)
    activity_dates = {event.created_at.date() for event in events}
    streak_days = current_streak_days(activity_dates)
    progress_by_code = achievement_progress(db, user_id, streak_days, dashboard_domain)
    achievements = award_earned_achievements(db, user_id, progress_by_code, dashboard_domain)
    completed_lessons = progress_by_code["first_lesson"]
    due_reviews = due_review_count(db, user_id, dashboard_domain)
    db.commit()
    PLATFORM_DASHBOARD_READS.labels(domain=dashboard_domain).inc()
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
    now = utc_now()
    cards = db.query(Flashcard).order_by(Flashcard.id).limit(200).all()
    due_cards = []
    for card in cards:
        state = find_review_state(db, user_id, card.id)
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
    state = get_or_create_review_state(db, payload.user_id, flashcard_id)
    now = utc_now()
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
    db.flush()
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
