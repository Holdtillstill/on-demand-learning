from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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
    user_id: str
    generated_at: datetime
    count: int
    cards: list[ReviewCardOut]


class ReviewAnswerIn(BaseModel):
    user_id: str = "demo-user"
    quality: int = Field(ge=0, le=5)
    correct: bool


class ReviewStateOut(BaseModel):
    user_id: str
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
    user_id: str
    recommended_lesson_id: int | None
    modules: list[LearningPathModule]


class PlatformLabOut(BaseModel):
    slug: str
    title: str
    track: str
    difficulty: str
    level_group: str
    estimated_minutes: int
    scenario: str
    skills: list[str]
    commands: list[str]
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


class PlatformResourcesOut(BaseModel):
    domains: list[str]
    types: list[str]
    resources: list[PlatformResourceOut]


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
    user_id: str = "demo-user"
    lesson_id: int
    completed: bool = False
    score: float = 0


class ProgressOut(ProgressIn):
    id: int
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class QuizAttemptIn(BaseModel):
    user_id: str = "demo-user"
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
    user_id: str
    xp: XpSummary
    daily_goal: DailyGoalSummary
    streak: StreakSummary
    achievements: list[AchievementOut]
    completed_lessons: int
    due_reviews: int
