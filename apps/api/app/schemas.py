from datetime import datetime

from pydantic import BaseModel, ConfigDict


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
