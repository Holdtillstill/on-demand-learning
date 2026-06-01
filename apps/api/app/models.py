from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.time_utils import utc_now


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    era: Mapped[str] = mapped_column(String(80), index=True)
    level: Mapped[str] = mapped_column(String(40), index=True)
    category: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text)
    subscription_tier: Mapped[str] = mapped_column(String(40), default="free")
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", cascade="all, delete-orphan", order_by="Lesson.sequence")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    summary: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    practice_notes: Mapped[str] = mapped_column(Text)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)
    course: Mapped[Course] = relationship(back_populates="lessons")
    terms: Mapped[list["GlossaryTerm"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    flashcards: Mapped[list["Flashcard"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")

    @property
    def course_slug(self) -> str | None:
        return self.course.slug if self.course else None

    @property
    def course_category(self) -> str | None:
        return self.course.category if self.course else None

    @property
    def course_era(self) -> str | None:
        return self.course.era if self.course else None


class GlossaryTerm(Base):
    __tablename__ = "glossary_terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    term: Mapped[str] = mapped_column(String(80))
    context: Mapped[str] = mapped_column(String(120))
    definition: Mapped[str] = mapped_column(String(250))
    lesson: Mapped[Lesson] = relationship(back_populates="terms")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    hint: Mapped[str] = mapped_column(String(160), default="")
    difficulty: Mapped[str] = mapped_column(String(40), default="beginner")
    lesson: Mapped[Lesson] = relationship(back_populates="flashcards")


class ReviewState(Base):
    __tablename__ = "review_states"
    __table_args__ = (UniqueConstraint("user_id", "flashcard_id", name="uq_review_state_user_flashcard"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    flashcard_id: Mapped[int] = mapped_column(ForeignKey("flashcards.id"), index=True)
    ease: Mapped[float] = mapped_column(Float, default=2.5)
    interval_days: Mapped[int] = mapped_column(Integer, default=0)
    due_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120))
    subscription_status: Mapped[str] = mapped_column(String(40), default="mock_active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    lesson: Mapped[Lesson] = relationship()


class PlatformActivity(Base):
    __tablename__ = "platform_activity"
    __table_args__ = (UniqueConstraint("user_id", "target_type", "target_id", name="uq_platform_activity_target"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    target_type: Mapped[str] = mapped_column(String(80), index=True)
    target_id: Mapped[str] = mapped_column(String(240), index=True)
    state: Mapped[str] = mapped_column(String(40), default="completed", index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class PlatformLabSubmission(Base):
    __tablename__ = "platform_lab_submissions"
    __table_args__ = (UniqueConstraint("user_id", "lab_slug", name="uq_platform_lab_submission_user_lab"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    lab_slug: Mapped[str] = mapped_column(String(240), index=True)
    worksheet_answers: Mapped[dict] = mapped_column(JSON, default=dict)
    checked_items: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(40), default="in_progress", index=True)
    score: Mapped[float] = mapped_column(Float, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)


class XpEvent(Base):
    __tablename__ = "xp_events"
    __table_args__ = (UniqueConstraint("user_id", "source", "source_id", name="uq_xp_event_source"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    source: Mapped[str] = mapped_column(String(80), index=True)
    source_id: Mapped[int] = mapped_column(Integer)
    xp: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, index=True)


class UserAchievement(Base):
    __tablename__ = "user_achievements"
    __table_args__ = (UniqueConstraint("user_id", "code", name="uq_user_achievement_code"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    code: Mapped[str] = mapped_column(String(80), index=True)
    awarded_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    score: Mapped[float] = mapped_column(Float)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
