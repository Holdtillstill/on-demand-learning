from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

MAX_PLATFORM_STATE_PROGRESS_ROWS = 120
MAX_PLATFORM_STATE_ACTIVITY_ROWS = 600
MAX_PLATFORM_STATE_LAB_ROWS = 40
MAX_PLATFORM_STATE_WORKSHEET_FIELDS = 80
MAX_PLATFORM_STATE_CHECKED_FIELDS = 160
MAX_PLATFORM_STATE_FIELD_KEY_LENGTH = 100
MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH = 4000
MAX_USER_ID_LENGTH = 80
USER_ID_PATTERN = r"^[A-Za-z0-9._:-]+$"
USER_ID_DESCRIPTION = "Guest learner profile key. Use letters, numbers, dot, underscore, colon, and hyphen only."
PLATFORM_STATE_TOKEN_PATTERN = r"^[A-Za-z0-9._:-]+$"
PLATFORM_STATE_TOKEN_DESCRIPTION = "Use letters, numbers, dot, underscore, colon, and hyphen only."
PLATFORM_LAB_STATUS_IN_PROGRESS = "in_progress"
PLATFORM_LAB_STATUS_SUBMITTED = "submitted"
PlatformLabStatus = Literal["in_progress", "submitted"]


def user_id_field(default: str = "demo-user", description: str = USER_ID_DESCRIPTION):
    return Field(
        default=default,
        min_length=1,
        max_length=MAX_USER_ID_LENGTH,
        pattern=USER_ID_PATTERN,
        description=description,
    )


def required_user_id_field(description: str = USER_ID_DESCRIPTION):
    return Field(
        ...,
        min_length=1,
        max_length=MAX_USER_ID_LENGTH,
        pattern=USER_ID_PATTERN,
        description=description,
    )


def validate_platform_worksheet_answers(value: dict[str, str]) -> dict[str, str]:
    for key, answer in value.items():
        if len(key) > MAX_PLATFORM_STATE_FIELD_KEY_LENGTH:
            raise ValueError("worksheet answer keys must be 100 characters or fewer")
        if len(answer) > MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH:
            raise ValueError("worksheet answers must be 4000 characters or fewer")
    return value


def validate_platform_checked_items(value: dict[str, bool]) -> dict[str, bool]:
    for key in value:
        if len(key) > MAX_PLATFORM_STATE_FIELD_KEY_LENGTH:
            raise ValueError("checked item keys must be 100 characters or fewer")
    return value


class VocabularyOut(BaseModel):
    id: int
    simplified: str
    traditional: str
    pinyin: str
    definition: str

    model_config = ConfigDict(from_attributes=True)


class FlashcardOut(BaseModel):
    id: int
    lesson_id: int
    prompt: str
    answer: str
    pinyin: str
    difficulty: str

    model_config = ConfigDict(from_attributes=True)


class ReviewCardOut(FlashcardOut):
    due_at: datetime
    interval_days: int = 0
    ease: float = 2.5


class DueReviewQueue(BaseModel):
    user_id: str = required_user_id_field()
    generated_at: datetime
    count: int
    cards: list[ReviewCardOut]


class ReviewAnswerIn(BaseModel):
    user_id: str = user_id_field()
    quality: int = Field(ge=0, le=5)
    correct: bool


class ReviewStateOut(BaseModel):
    user_id: str = required_user_id_field()
    flashcard_id: int
    ease: float
    interval_days: int
    due_at: datetime
    last_reviewed_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CharacterOut(BaseModel):
    id: int
    simplified: str
    traditional: str
    pinyin: str
    meaning: str
    radical: str
    strokes: int
    mnemonic: str
    cultural_note: str
    example_words: list[str]

    model_config = ConfigDict(from_attributes=True)


class LessonSummary(BaseModel):
    id: int
    course_id: int
    title: str
    summary: str
    sequence: int

    model_config = ConfigDict(from_attributes=True)


class LessonOut(LessonSummary):
    body_simplified: str
    body_traditional: str
    pinyin: str
    audio_url: str | None
    video_url: str | None
    course_slug: str | None = None
    course_category: str | None = None
    course_era: str | None = None
    vocabulary: list[VocabularyOut] = []
    flashcards: list[FlashcardOut] = []


class CourseOut(BaseModel):
    id: int
    slug: str
    title: str
    era: str
    level: str
    category: str
    description: str
    subscription_tier: str
    lessons: list[LessonSummary] = []

    model_config = ConfigDict(from_attributes=True)


class LearningPathLesson(BaseModel):
    id: int
    title: str
    summary: str
    sequence: int
    state: str
    score: float | None = None


class LearningPathModule(BaseModel):
    course_id: int
    slug: str
    title: str
    category: str
    era: str
    level: str
    sequence: int
    locked: bool
    lessons: list[LearningPathLesson]


class LearningPathOut(BaseModel):
    user_id: str = required_user_id_field()
    recommended_lesson_id: int | None
    modules: list[LearningPathModule]


class PlatformLabOut(BaseModel):
    slug: str
    title: str
    track: str
    difficulty: str
    level_group: str
    estimated_minutes: int
    lab_tier: str
    portfolio_grade: bool = False
    portfolio_focus: str = ""
    scenario: str
    skills: list[str]
    prerequisites: list[str] = Field(default_factory=list)
    setup_commands: list[str] = Field(default_factory=list)
    commands: list[str]
    practice_steps: list[str] = Field(default_factory=list)
    expected_evidence: list[str] = Field(default_factory=list)
    validation_commands: list[str] = Field(default_factory=list)
    cleanup_commands: list[str] = Field(default_factory=list)
    no_cluster_fallback: list[str] = Field(default_factory=list)
    artifact_paths: list[str] = Field(default_factory=list)
    learner_artifact_paths: list[str] = Field(default_factory=list)
    worksheet_prompts: list[str] = Field(default_factory=list)
    rubric: list[str] = Field(default_factory=list)
    validation_checks: list[str] = Field(default_factory=list)
    checklist: list[str]
    course_slug: str
    lesson_id: int | None = None


class PlatformTrackOut(BaseModel):
    slug: str
    title: str
    role: str
    summary: str
    level_group: str
    audience: str
    outcomes: list[str]
    course: CourseOut


class PlatformLevelOut(BaseModel):
    slug: str
    title: str
    level_group: str
    audience: str
    total_courses: int
    total_lessons: int
    courses: list[CourseOut]


class PlatformAcademyCatalogOut(BaseModel):
    title: str
    promise: str
    total_courses: int
    total_lessons: int
    levels: list[PlatformLevelOut]
    tracks: list[PlatformTrackOut]
    labs: list[PlatformLabOut]


class PlatformRoadmapStageOut(BaseModel):
    sequence: int
    title: str
    role: str
    focus: str
    level_group: str
    course_slugs: list[str]
    checkpoints: list[str]


class PlatformAcademyRoadmapOut(BaseModel):
    stages: list[PlatformRoadmapStageOut]


class PlatformOfficialSourceOut(BaseModel):
    label: str
    url: str


class PlatformResourceOut(BaseModel):
    slug: str
    title: str
    domain: str
    level_group: str
    resource_type: str
    estimated_minutes: int
    summary: str
    outcomes: list[str]
    prerequisites: list[str]
    safety_level: str
    commands: list[str]
    artifacts: list[str]
    related_lessons: list[int] = Field(default_factory=list)
    related_labs: list[str] = Field(default_factory=list)
    next_steps: list[str]
    source_takeaways: list[str] = Field(default_factory=list)
    study_tasks: list[str] = Field(default_factory=list)
    interview_prompts: list[str] = Field(default_factory=list)
    official_sources: list[PlatformOfficialSourceOut] = Field(default_factory=list)
    source_url: Optional[str] = None
    source_label: Optional[str] = None
    reviewed_at: Optional[str] = None


class PlatformResourcesOut(BaseModel):
    domains: list[str]
    types: list[str]
    resources: list[PlatformResourceOut]


class PlatformInterviewQuestionOut(BaseModel):
    question: str
    scenario: str
    answer_outline: list[str]
    strong_signals: list[str]
    red_flags: list[str]
    practice_task: str


class PlatformInterviewPrepOut(BaseModel):
    slug: str
    title: str
    domain: str
    level_group: str
    focus: str
    related_course_slug: str
    related_labs: list[str]
    official_sources: list[PlatformOfficialSourceOut]
    questions: list[PlatformInterviewQuestionOut]


class PlatformInterviewPrepIndexOut(BaseModel):
    domains: list[str]
    levels: list[str]
    total_questions: int
    packs: list[PlatformInterviewPrepOut]


class VocabularyIn(BaseModel):
    simplified: str = Field(min_length=1, max_length=80)
    traditional: str = Field(min_length=1, max_length=80)
    pinyin: str = Field(min_length=1, max_length=120)
    definition: str = Field(min_length=1, max_length=250)


class FlashcardIn(BaseModel):
    prompt: str = Field(min_length=1)
    answer: str = Field(min_length=1)
    pinyin: str = ""
    difficulty: str = "beginner"


class LessonCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    summary: str = Field(min_length=1)
    body_simplified: str = Field(min_length=1)
    body_traditional: str = Field(min_length=1)
    pinyin: str = Field(min_length=1)
    audio_url: str | None = None
    video_url: str | None = None
    vocabulary: list[VocabularyIn] = Field(default_factory=list)
    flashcards: list[FlashcardIn] = Field(default_factory=list)


class CourseCreate(BaseModel):
    slug: str = Field(min_length=3, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=1, max_length=200)
    era: str = Field(min_length=1, max_length=80)
    level: str = Field(min_length=1, max_length=40)
    category: str = Field(min_length=1, max_length=80)
    description: str = Field(min_length=1)
    subscription_tier: str = "free"
    lessons: list[LessonCreate] = Field(default_factory=list, min_length=1)


class ProgressIn(BaseModel):
    user_id: str = user_id_field()
    lesson_id: int
    completed: bool = False
    score: float = 0


class ProgressOut(ProgressIn):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformActivityIn(BaseModel):
    user_id: str = user_id_field()
    target_type: str = Field(
        min_length=1,
        max_length=80,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )
    target_id: str = Field(
        min_length=1,
        max_length=240,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )
    state: str = Field(
        default="completed",
        min_length=1,
        max_length=40,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )


class PlatformActivityOut(PlatformActivityIn):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformLearnerStateProgress(BaseModel):
    lesson_id: int
    completed: bool = False
    score: float = Field(default=0, ge=0, le=1)
    updated_at: datetime | None = None


class PlatformLearnerStateActivity(BaseModel):
    target_type: str = Field(
        min_length=1,
        max_length=80,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )
    target_id: str = Field(
        min_length=1,
        max_length=240,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )
    state: str = Field(
        default="completed",
        min_length=1,
        max_length=40,
        pattern=PLATFORM_STATE_TOKEN_PATTERN,
        description=PLATFORM_STATE_TOKEN_DESCRIPTION,
    )
    updated_at: datetime | None = None


class PlatformLabSubmissionIn(BaseModel):
    user_id: str = user_id_field()
    worksheet_answers: dict[str, str] = Field(
        default_factory=dict,
        max_length=MAX_PLATFORM_STATE_WORKSHEET_FIELDS,
        description="Worksheet answers keyed by workbook prompt ID.",
    )
    checked_items: dict[str, bool] = Field(
        default_factory=dict,
        max_length=MAX_PLATFORM_STATE_CHECKED_FIELDS,
        description="Completed validation and worksheet checklist items keyed by workbook item ID.",
    )
    status: PlatformLabStatus = Field(default=PLATFORM_LAB_STATUS_IN_PROGRESS, description="Workbook state.")

    @field_validator("worksheet_answers")
    @classmethod
    def worksheet_answers_are_bounded(cls, value: dict[str, str]) -> dict[str, str]:
        return validate_platform_worksheet_answers(value)

    @field_validator("checked_items")
    @classmethod
    def checked_item_keys_are_bounded(cls, value: dict[str, bool]) -> dict[str, bool]:
        return validate_platform_checked_items(value)

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_id": "guest-a1b2c3d4e5f6",
                "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            }
        }
    )


class PlatformLabRubricFeedback(BaseModel):
    criterion: str
    status: str
    feedback: str
    evidence_terms: list[str] = Field(default_factory=list)


class PlatformLabSubmissionOut(PlatformLabSubmissionIn):
    id: int
    lab_slug: str
    score: float
    completed_checks: int
    total_checks: int
    answered_prompts: int
    total_prompts: int
    evidence_terms: list[str] = Field(default_factory=list)
    rubric_feedback: list[PlatformLabRubricFeedback] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PlatformLearnerStateLabSubmission(BaseModel):
    lab_slug: str = Field(min_length=1, max_length=240, description="Platform Academy lab slug.")
    worksheet_answers: dict[str, str] = Field(
        default_factory=dict,
        max_length=MAX_PLATFORM_STATE_WORKSHEET_FIELDS,
        description="Saved worksheet answers keyed by workbook prompt ID.",
    )
    checked_items: dict[str, bool] = Field(
        default_factory=dict,
        max_length=MAX_PLATFORM_STATE_CHECKED_FIELDS,
        description="Saved validation and checklist completion state keyed by workbook item ID.",
    )
    status: PlatformLabStatus = Field(default=PLATFORM_LAB_STATUS_IN_PROGRESS, description="Saved workbook state.")
    updated_at: datetime | None = None

    @field_validator("worksheet_answers")
    @classmethod
    def worksheet_answers_are_bounded(cls, value: dict[str, str]) -> dict[str, str]:
        return validate_platform_worksheet_answers(value)

    @field_validator("checked_items")
    @classmethod
    def checked_item_keys_are_bounded(cls, value: dict[str, bool]) -> dict[str, bool]:
        return validate_platform_checked_items(value)


class PlatformLearnerStateExport(BaseModel):
    schema_version: int = Field(default=1, ge=1, le=1, description="Portable learner-state schema version. Only version 1 is accepted.")
    exported_at: datetime = Field(description="UTC export timestamp.")
    source_user_id: str = required_user_id_field("Guest learner profile key that produced the backup.")
    progress: list[PlatformLearnerStateProgress] = Field(
        default_factory=list,
        max_length=MAX_PLATFORM_STATE_PROGRESS_ROWS,
        description="Platform Academy lesson progress only.",
    )
    activity: list[PlatformLearnerStateActivity] = Field(
        default_factory=list,
        max_length=MAX_PLATFORM_STATE_ACTIVITY_ROWS,
        description="Saved Platform Academy resource, interview, and navigation activity only.",
    )
    lab_submissions: list[PlatformLearnerStateLabSubmission] = Field(
        default_factory=list,
        max_length=MAX_PLATFORM_STATE_LAB_ROWS,
        description="Saved Platform Academy lab workbook submissions only.",
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "schema_version": 1,
                "exported_at": "2026-05-31T18:45:00Z",
                "source_user_id": "guest-a1b2c3d4e5f6",
                "progress": [{"lesson_id": 101, "completed": True, "score": 1, "updated_at": "2026-05-31T18:30:00Z"}],
                "activity": [
                    {
                        "target_type": "resource",
                        "target_id": "kubernetes-debugging-cheatsheet",
                        "state": "completed",
                        "updated_at": "2026-05-31T18:35:00Z",
                    }
                ],
                "lab_submissions": [
                    {
                        "lab_slug": "trace-service-to-pod",
                        "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                        "checked_items": {"worksheet-0": True, "validation-0": True},
                        "status": "submitted",
                        "updated_at": "2026-05-31T18:40:00Z",
                    }
                ],
            }
        }
    )


class PlatformLearnerStateImportIn(BaseModel):
    target_user_id: str = required_user_id_field("Guest learner profile key that should receive the imported backup.")
    state: PlatformLearnerStateExport

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "target_user_id": "guest-f6e5d4c3b2a1",
                "state": PlatformLearnerStateExport.model_config["json_schema_extra"]["example"],
            }
        }
    )


class PlatformLearnerStateImportOut(BaseModel):
    user_id: str = required_user_id_field("Guest learner profile key that received the imported backup.")
    progress_imported: int = Field(description="Count of Platform Academy progress rows imported.")
    activity_imported: int = Field(description="Count of Platform Academy activity rows imported.")
    lab_submissions_imported: int = Field(description="Count of Platform Academy lab submissions imported.")


class QuizAttemptIn(BaseModel):
    user_id: str = user_id_field()
    lesson_id: int
    score: float
    answers: dict = {}


class QuizAttemptOut(QuizAttemptIn):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SearchResult(BaseModel):
    courses: list[CourseOut]
    lessons: list[LessonSummary]


class XpSummary(BaseModel):
    total: int
    lesson_completion_xp: int
    quiz_xp: int
    review_xp: int


class DailyGoalSummary(BaseModel):
    target_xp: int
    earned_xp_today: int
    met: bool


class StreakSummary(BaseModel):
    current_days: int
    freeze_available: bool
    last_activity_date: str | None


class AchievementOut(BaseModel):
    code: str
    title: str
    description: str
    earned: bool
    progress: int
    target: int
    awarded_at: datetime | None = None


class UserDashboard(BaseModel):
    user_id: str = required_user_id_field()
    xp: XpSummary
    daily_goal: DailyGoalSummary
    streak: StreakSummary
    achievements: list[AchievementOut]
    completed_lessons: int
    due_reviews: int
