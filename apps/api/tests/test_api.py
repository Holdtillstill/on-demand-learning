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


def test_platform_academy_catalog_roadmap_and_labs():
    catalog = client.get("/api/platform-academy/catalog")
    assert catalog.status_code == 200
    payload = catalog.json()
    assert payload["title"] == "Platform Academy"
    assert payload["total_courses"] >= 15
    assert payload["total_lessons"] >= 60
    assert {level["level_group"]: level["total_courses"] for level in payload["levels"]} == {
        "Fresher": 5,
        "Intermediate": 5,
        "Advanced": 5,
    }
    assert all(level["total_lessons"] >= 20 for level in payload["levels"])
    expected_categories = {
        "Kubernetes",
        "kubectl",
        "Cloud Native",
        "Linux",
        "Networking",
        "EKS",
        "Helm",
        "ArgoCD",
        "Terraform",
        "AWS IAM",
        "Security",
        "SRE",
        "CI/CD",
        "Platform Engineering",
    }
    assert {track["course"]["category"] for track in payload["tracks"]} >= expected_categories
    assert {track["level_group"] for track in payload["tracks"]} == {"Fresher", "Intermediate", "Advanced"}
    kubernetes_track = next(track for track in payload["tracks"] if track["slug"] == "kubernetes-fundamentals")
    assert len(kubernetes_track["course"]["lessons"]) >= 4
    assert any("CrashLoopBackOff" in lab["title"] for lab in payload["labs"])
    assert {lab["level_group"] for lab in payload["labs"]} == {"Fresher", "Intermediate", "Advanced"}
    assert all(lab["lesson_id"] for lab in payload["labs"])

    roadmap = client.get("/api/platform-academy/roadmap")
    assert roadmap.status_code == 200
    stages = roadmap.json()["stages"]
    assert len(stages) >= 15
    assert stages[0]["title"] == "Linux Operator Foundations"
    assert stages[1]["title"] == "Networking Mental Model"
    assert stages[2]["title"] == "Kubernetes Object Mental Model"
    assert {stage["level_group"] for stage in stages} == {"Fresher", "Intermediate", "Advanced"}

    labs = client.get("/api/platform-academy/labs")
    assert labs.status_code == 200
    assert len(labs.json()) >= 15
    assert {lab["track"] for lab in labs.json()} >= expected_categories

    resources = client.get("/api/platform-academy/resources")
    assert resources.status_code == 200
    resource_payload = resources.json()
    assert len(resource_payload["resources"]) >= 80
    assert len(resource_payload["domains"]) >= 14
    assert len(resource_payload["types"]) >= 10
    assert {item["domain"] for item in resource_payload["resources"]} >= expected_categories | {
        "Docker",
        "Incident Response",
        "FinOps",
        "Career",
    }
    must_have_types = {
        "cheatsheet",
        "runbook",
        "lab worksheet",
        "project brief",
        "interview prep",
        "official reference",
        "architecture diagram",
        "template",
        "assessment",
        "troubleshooting guide",
    }
    assert set(resource_payload["types"]) >= must_have_types
    assert all(resource["related_lessons"] or resource["related_labs"] for resource in resource_payload["resources"])
    assert all(resource["source_url"].startswith("https://") for resource in resource_payload["resources"])
    assert all(resource["source_label"] for resource in resource_payload["resources"])
    assert all(resource["reviewed_at"] for resource in resource_payload["resources"])
    kubernetes_reference = next(
        resource for resource in resource_payload["resources"] if resource["slug"] == "kubernetes-official-reference"
    )
    assert kubernetes_reference["source_url"] == "https://kubernetes.io/docs/tasks/debug/"
    assert kubernetes_reference["source_label"] == "Kubernetes official debugging docs"


def test_course_domain_filters_keep_zhongwen_and_platform_separate():
    zhongwen = client.get("/api/courses?domain=zhongwen")
    assert zhongwen.status_code == 200
    assert zhongwen.json()
    assert all(course["era"] != "Platform Academy" for course in zhongwen.json())

    platform = client.get("/api/courses?domain=platform")
    assert platform.status_code == 200
    platform_courses = platform.json()
    assert len(platform_courses) >= 15
    assert all(course["era"] == "Platform Academy" for course in platform_courses)

    invalid = client.get("/api/courses?domain=bad")
    assert invalid.status_code == 400


def test_lesson_and_flashcards():
    courses = client.get("/api/courses").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    lesson = client.get(f"/api/lessons/{lesson_id}")
    assert lesson.status_code == 200
    assert lesson.json()["vocabulary"]
    cards = client.get(f"/api/flashcards?lesson_id={lesson_id}")
    assert cards.status_code == 200
    assert cards.json()


def test_platform_lesson_contains_teaching_terms_and_review_prompts():
    catalog = client.get("/api/platform-academy/catalog").json()
    lesson_id = next(track for track in catalog["tracks"] if track["slug"] == "eks-operations")["course"]["lessons"][2]["id"]
    lesson = client.get(f"/api/lessons/{lesson_id}")
    assert lesson.status_code == 200
    payload = lesson.json()
    assert payload["course_era"] == "Platform Academy"
    assert "IRSA" in payload["body_simplified"]
    assert "service account" in payload["body_simplified"]
    assert payload["vocabulary"]
    assert payload["flashcards"]

    search = client.get("/api/search?q=CrashLoopBackOff")
    assert search.status_code == 200
    assert search.json()["lessons"]


def test_progress_and_quiz_attempt():
    payload = {"user_id": "demo-user", "lesson_id": 1, "completed": True, "score": 0.9}
    progress = client.post("/api/progress", json=payload)
    assert progress.status_code == 200
    assert progress.json()["completed"] is True

    attempt = client.post("/api/quiz/attempts", json={"user_id": "demo-user", "lesson_id": 1, "score": 0.8, "answers": {"1": "hello"}})
    assert attempt.status_code == 200
    assert attempt.json()["score"] == 0.8


def test_progress_creates_guest_user_before_progress_rows():
    courses = client.get("/api/courses?domain=platform").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    user_id = "guest-api-progress-regression"

    progress = client.post("/api/progress", json={"user_id": user_id, "lesson_id": lesson_id, "completed": True, "score": 1})
    assert progress.status_code == 200
    assert progress.json()["user_id"] == user_id
    assert progress.json()["completed"] is True

    rows = client.get(f"/api/progress/{user_id}")
    assert rows.status_code == 200
    assert any(row["lesson_id"] == lesson_id and row["completed"] for row in rows.json())

    dashboard = client.get(f"/api/users/{user_id}/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["completed_lessons"] >= 1
    assert dashboard.json()["xp"]["lesson_completion_xp"] >= 20


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
