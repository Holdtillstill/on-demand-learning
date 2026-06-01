"""Create initial application schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-05-31 02:10:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial_schema"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "courses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("era", sa.String(length=80), nullable=False),
        sa.Column("level", sa.String(length=40), nullable=False),
        sa.Column("category", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("subscription_tier", sa.String(length=40), nullable=False),
    )
    op.create_index("ix_courses_slug", "courses", ["slug"], unique=True)
    op.create_index("ix_courses_title", "courses", ["title"])
    op.create_index("ix_courses_era", "courses", ["era"])
    op.create_index("ix_courses_level", "courses", ["level"])
    op.create_index("ix_courses_category", "courses", ["category"])

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=80), primary_key=True),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("subscription_status", sa.String(length=40), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "character_metadata",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("simplified", sa.String(length=8), nullable=False),
        sa.Column("traditional", sa.String(length=8), nullable=False),
        sa.Column("pinyin", sa.String(length=80), nullable=False),
        sa.Column("meaning", sa.String(length=160), nullable=False),
        sa.Column("radical", sa.String(length=40), nullable=False),
        sa.Column("strokes", sa.Integer(), nullable=False),
        sa.Column("mnemonic", sa.Text(), nullable=False),
        sa.Column("cultural_note", sa.Text(), nullable=False),
        sa.Column("example_words", sa.JSON(), nullable=False),
    )
    op.create_index("ix_character_metadata_simplified", "character_metadata", ["simplified"], unique=True)
    op.create_index("ix_character_metadata_traditional", "character_metadata", ["traditional"])

    op.create_table(
        "lessons",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("body_simplified", sa.Text(), nullable=False),
        sa.Column("body_traditional", sa.Text(), nullable=False),
        sa.Column("pinyin", sa.Text(), nullable=False),
        sa.Column("audio_url", sa.String(length=500), nullable=True),
        sa.Column("video_url", sa.String(length=500), nullable=True),
        sa.Column("sequence", sa.Integer(), nullable=False),
    )
    op.create_index("ix_lessons_course_id", "lessons", ["course_id"])
    op.create_index("ix_lessons_title", "lessons", ["title"])

    op.create_table(
        "vocabulary_terms",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("simplified", sa.String(length=80), nullable=False),
        sa.Column("traditional", sa.String(length=80), nullable=False),
        sa.Column("pinyin", sa.String(length=120), nullable=False),
        sa.Column("definition", sa.String(length=250), nullable=False),
    )
    op.create_index("ix_vocabulary_terms_lesson_id", "vocabulary_terms", ["lesson_id"])

    op.create_table(
        "flashcards",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column("pinyin", sa.String(length=160), nullable=False),
        sa.Column("difficulty", sa.String(length=40), nullable=False),
    )
    op.create_index("ix_flashcards_lesson_id", "flashcards", ["lesson_id"])

    op.create_table(
        "review_states",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("flashcard_id", sa.Integer(), sa.ForeignKey("flashcards.id"), nullable=False),
        sa.Column("ease", sa.Float(), nullable=False),
        sa.Column("interval_days", sa.Integer(), nullable=False),
        sa.Column("due_at", sa.DateTime(), nullable=False),
        sa.Column("last_reviewed_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "flashcard_id", name="uq_review_state_user_flashcard"),
    )
    op.create_index("ix_review_states_user_id", "review_states", ["user_id"])
    op.create_index("ix_review_states_flashcard_id", "review_states", ["flashcard_id"])
    op.create_index("ix_review_states_due_at", "review_states", ["due_at"])

    op.create_table(
        "progress",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("completed", sa.Boolean(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "lesson_id", name="uq_progress_user_lesson"),
    )
    op.create_index("ix_progress_user_id", "progress", ["user_id"])
    op.create_index("ix_progress_lesson_id", "progress", ["lesson_id"])

    op.create_table(
        "platform_activity",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("target_type", sa.String(length=80), nullable=False),
        sa.Column("target_id", sa.String(length=240), nullable=False),
        sa.Column("state", sa.String(length=40), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "target_type", "target_id", name="uq_platform_activity_target"),
    )
    op.create_index("ix_platform_activity_user_id", "platform_activity", ["user_id"])
    op.create_index("ix_platform_activity_target_type", "platform_activity", ["target_type"])
    op.create_index("ix_platform_activity_target_id", "platform_activity", ["target_id"])
    op.create_index("ix_platform_activity_state", "platform_activity", ["state"])

    op.create_table(
        "platform_lab_submissions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lab_slug", sa.String(length=240), nullable=False),
        sa.Column("worksheet_answers", sa.JSON(), nullable=False),
        sa.Column("checked_items", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=40), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "lab_slug", name="uq_platform_lab_submission_user_lab"),
    )
    op.create_index("ix_platform_lab_submissions_user_id", "platform_lab_submissions", ["user_id"])
    op.create_index("ix_platform_lab_submissions_lab_slug", "platform_lab_submissions", ["lab_slug"])
    op.create_index("ix_platform_lab_submissions_status", "platform_lab_submissions", ["status"])

    op.create_table(
        "xp_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "source", "source_id", name="uq_xp_event_source"),
    )
    op.create_index("ix_xp_events_user_id", "xp_events", ["user_id"])
    op.create_index("ix_xp_events_source", "xp_events", ["source"])
    op.create_index("ix_xp_events_created_at", "xp_events", ["created_at"])

    op.create_table(
        "user_achievements",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("awarded_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "code", name="uq_user_achievement_code"),
    )
    op.create_index("ix_user_achievements_user_id", "user_achievements", ["user_id"])
    op.create_index("ix_user_achievements_code", "user_achievements", ["code"])

    op.create_table(
        "quiz_attempts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("lesson_id", sa.Integer(), sa.ForeignKey("lessons.id"), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("answers", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_quiz_attempts_user_id", "quiz_attempts", ["user_id"])
    op.create_index("ix_quiz_attempts_lesson_id", "quiz_attempts", ["lesson_id"])

    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(length=80), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("course_id", sa.Integer(), sa.ForeignKey("courses.id"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_course_id", "recommendations", ["course_id"])


def downgrade() -> None:
    for table_name in [
        "recommendations",
        "quiz_attempts",
        "user_achievements",
        "xp_events",
        "platform_lab_submissions",
        "platform_activity",
        "progress",
        "review_states",
        "flashcards",
        "vocabulary_terms",
        "lessons",
        "character_metadata",
        "users",
        "courses",
    ]:
        op.drop_table(table_name)
