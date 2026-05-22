from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


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
    lessons: Mapped[list["Lesson"]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    summary: Mapped[str] = mapped_column(Text)
    body_simplified: Mapped[str] = mapped_column(Text)
    body_traditional: Mapped[str] = mapped_column(Text)
    pinyin: Mapped[str] = mapped_column(Text)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sequence: Mapped[int] = mapped_column(Integer, default=1)
    course: Mapped[Course] = relationship(back_populates="lessons")
    vocabulary: Mapped[list["VocabularyTerm"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")
    flashcards: Mapped[list["Flashcard"]] = relationship(back_populates="lesson", cascade="all, delete-orphan")


class VocabularyTerm(Base):
    __tablename__ = "vocabulary_terms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    simplified: Mapped[str] = mapped_column(String(80))
    traditional: Mapped[str] = mapped_column(String(80))
    pinyin: Mapped[str] = mapped_column(String(120))
    definition: Mapped[str] = mapped_column(String(250))
    lesson: Mapped[Lesson] = relationship(back_populates="vocabulary")


class Flashcard(Base):
    __tablename__ = "flashcards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    pinyin: Mapped[str] = mapped_column(String(160), default="")
    difficulty: Mapped[str] = mapped_column(String(40), default="beginner")
    lesson: Mapped[Lesson] = relationship(back_populates="flashcards")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120))
    subscription_status: Mapped[str] = mapped_column(String(40), default="mock_active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Progress(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(Float, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey("lessons.id"), index=True)
    score: Mapped[float] = mapped_column(Float)
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    reason: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
