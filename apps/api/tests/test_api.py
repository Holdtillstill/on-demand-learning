import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_database  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

client = TestClient(app)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_database(db)


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_courses_are_seeded():
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) >= 5
    assert any(course["era"] == "Tang" for course in courses)


def test_lesson_and_flashcards():
    courses = client.get("/api/courses").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    lesson = client.get(f"/api/lessons/{lesson_id}")
    assert lesson.status_code == 200
    assert lesson.json()["vocabulary"]
    cards = client.get(f"/api/flashcards?lesson_id={lesson_id}")
    assert cards.status_code == 200
    assert cards.json()


def test_progress_and_quiz_attempt():
    payload = {"user_id": "demo-user", "lesson_id": 1, "completed": True, "score": 0.9}
    progress = client.post("/api/progress", json=payload)
    assert progress.status_code == 200
    assert progress.json()["completed"] is True

    attempt = client.post("/api/quiz/attempts", json={"user_id": "demo-user", "lesson_id": 1, "score": 0.8, "answers": {"1": "hello"}})
    assert attempt.status_code == 200
    assert attempt.json()["score"] == 0.8


def test_search_and_metrics():
    search = client.get("/api/search?q=Tang")
    assert search.status_code == 200
    assert search.json()["courses"]
    metrics = client.get("/metrics")
    assert metrics.status_code == 200
    assert "zhongwen_api_requests_total" in metrics.text


def test_seed_database_is_repeatable_after_reset():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
        first_count = len(client.get("/api/courses").json())
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    second_count = len(client.get("/api/courses").json())
    assert second_count == first_count


def test_admin_upload_course_flow():
    payload = {
        "slug": "calligraphy-orchid-preface",
        "title": "Calligraphy: Wang Xizhi and the Orchid Pavilion Preface",
        "era": "Eastern Jin",
        "level": "Advanced",
        "category": "Art",
        "description": "Upload flow smoke test for a course about 行书 rhythm, gathering, and cultural memory.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Reading 行书 as Movement",
                "summary": "A short authoring-flow lesson with vocabulary and flashcards.",
                "body_simplified": "《兰亭集序》表现了书法的节奏、聚会的雅趣和时间的感叹。",
                "body_traditional": "《蘭亭集序》表現了書法的節奏、聚會的雅趣和時間的感嘆。",
                "pinyin": "Lántíng jí xù biǎoxiàn le shūfǎ de jiézòu.",
                "audio_url": None,
                "video_url": "https://example.com/media/orchid-preface.mp4",
                "vocabulary": [
                    {"simplified": "书法", "traditional": "書法", "pinyin": "shūfǎ", "definition": "calligraphy"},
                    {"simplified": "节奏", "traditional": "節奏", "pinyin": "jiézòu", "definition": "rhythm"},
                ],
                "flashcards": [
                    {"prompt": "What does 书法 mean?", "answer": "calligraphy", "pinyin": "shūfǎ", "difficulty": "intermediate"}
                ],
            }
        ],
    }

    created = client.post("/api/admin/courses", json=payload)
    assert created.status_code == 201
    course = created.json()
    assert course["slug"] == "calligraphy-orchid-preface"
    assert course["lessons"][0]["title"] == "Reading 行书 as Movement"

    duplicate = client.post("/api/admin/courses", json=payload)
    assert duplicate.status_code == 409

    search = client.get("/api/search?q=兰亭")
    assert search.status_code == 200
    assert search.json()["lessons"]


def test_learning_path_marks_completion_and_recommendation():
    courses = client.get("/api/courses").json()
    first_lesson_id = courses[0]["lessons"][0]["id"]
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": first_lesson_id, "completed": True, "score": 1})

    response = client.get("/api/learning-path?user_id=demo-user")
    assert response.status_code == 200
    path = response.json()

    assert path["user_id"] == "demo-user"
    assert path["modules"]
    lesson_states = [lesson["state"] for module in path["modules"] for lesson in module["lessons"]]
    assert "completed" in lesson_states
    assert "recommended" in lesson_states
    assert "locked" in lesson_states


def test_user_dashboard_reports_xp_streak_goal_and_achievements():
    courses = client.get("/api/courses").json()
    first_lesson_id = courses[0]["lessons"][0]["id"]
    poetry_lesson_id = next(
        lesson["id"]
        for course in courses
        if course["category"] == "Literature"
        for lesson in course["lessons"]
    )
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": first_lesson_id, "completed": True, "score": 1})
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": poetry_lesson_id, "completed": True, "score": 1})
    client.post(
        "/api/quiz/attempts",
        json={"user_id": "demo-user", "lesson_id": first_lesson_id, "score": 0.8, "answers": {"tone": "声调"}},
    )

    response = client.get("/api/users/demo-user/dashboard")
    assert response.status_code == 200
    dashboard = response.json()

    assert dashboard["xp"]["total"] >= 48
    assert dashboard["xp"]["total"] == dashboard["xp"]["lesson_completion_xp"] + dashboard["xp"]["quiz_xp"] + dashboard["xp"]["review_xp"]
    assert dashboard["daily_goal"]["target_xp"] == 50
    assert dashboard["daily_goal"]["earned_xp_today"] >= 48
    assert dashboard["streak"]["current_days"] >= 1
    earned = {achievement["code"] for achievement in dashboard["achievements"] if achievement["earned"]}
    assert {"first_lesson", "poetry_explorer"}.issubset(earned)


def test_due_reviews_and_answer_update_schedule():
    card = client.get("/api/flashcards").json()[0]

    due = client.get("/api/reviews/due?user_id=demo-user")
    assert due.status_code == 200
    assert any(item["id"] == card["id"] for item in due.json()["cards"])

    answer = client.post(f"/api/reviews/{card['id']}/answer", json={"user_id": "demo-user", "quality": 5, "correct": True})
    assert answer.status_code == 200
    updated = answer.json()
    assert updated["flashcard_id"] == card["id"]
    assert updated["interval_days"] >= 1
    assert updated["ease"] > 2
    assert updated["due_at"] > updated["last_reviewed_at"]


def test_character_practice_metadata():
    response = client.get("/api/characters")
    assert response.status_code == 200
    characters = response.json()
    moon = next(item for item in characters if item["simplified"] == "月")
    assert moon["traditional"] == "月"
    assert moon["pinyin"] == "yuè"
    assert moon["radical"]
    assert moon["strokes"] > 0
    assert moon["example_words"]

    detail = client.get(f"/api/characters/{moon['id']}")
    assert detail.status_code == 200
    assert detail.json()["mnemonic"]
