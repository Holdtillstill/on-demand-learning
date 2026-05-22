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
