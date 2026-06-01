from copy import deepcopy

from sqlalchemy.orm import Session

from app.models import Course, Flashcard, GlossaryTerm, Lesson, User
from app.platform_content import PLATFORM_COURSES

SEED_COURSES = PLATFORM_COURSES

def seed_database(db: Session) -> None:
    if not db.get(User, "demo-user"):
        db.add(User(id="demo-user", display_name="Demo Learner", subscription_status="mock_active"))
    for course_data in deepcopy(SEED_COURSES):
        if db.query(Course).filter(Course.slug == course_data["slug"]).first():
            continue
        lessons = course_data.pop("lessons")
        course = Course(**course_data)
        db.add(course)
        db.flush()
        for index, lesson_data in enumerate(lessons, start=1):
            terms = lesson_data.pop("terms")
            cards = lesson_data.pop("flashcards")
            lesson = Lesson(course_id=course.id, sequence=index, **lesson_data)
            db.add(lesson)
            db.flush()
            for term in terms:
                db.add(GlossaryTerm(lesson_id=lesson.id, **term))
            for card in cards:
                db.add(Flashcard(lesson_id=lesson.id, **card))
    db.commit()
