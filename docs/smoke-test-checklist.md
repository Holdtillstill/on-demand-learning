# Smoke Test Checklist

Run this after every local rebuild, Docker Compose demo, shared-EKS preview, or production-like deployment.

## HTTP

- `GET /healthz` returns `200`.
- `GET /readyz` returns `200` when database and Redis are healthy.
- `GET /api/platform-academy/catalog` returns `21` courses and `84` lessons.
- `GET /api/platform-academy/resources` returns `320` resources.
- `GET /api/platform-academy/interview-prep` returns `22` prep packs and `219` questions.
- Academy API responses use `Cache-Control: no-store` for catalog/resources/interview/activity endpoints.

## Browser

- `/dashboard/home` renders the dashboard without topbar overlap.
- `/dashboard/home` shows 21 courses, 84 lessons, 21 labs, 320 resources, and 219 interview questions.
- `/roadmap` renders all roadmap stages and remains readable on desktop and mobile widths.
- `/labs` renders lab cards and linked course/lesson actions.
- `/resources` renders dense topic filters without pushing the content awkwardly below the first viewport.
- `/interview-prep` renders horizontal prep packs and keeps selected content visible without a long scroll-back loop.
- A course page opens from the dashboard or course list.
- A lesson page opens, shows previous/next lesson navigation, and keeps lesson text readable.

## Learner State

- A new browser profile receives a `guest-...` learner ID in local storage.
- Manual lesson completion persists progress for the current guest.
- Auto-complete after reading posts only once per lesson.
- Resource review, lab run, and interview question practice activity persists for the current guest.
- Recovery key restore switches back to the expected guest profile.
- Starting a new profile creates a distinct learner ID without deleting previous backend rows.

## Deployment Settings

- Frontend API origin/proxy is correct for the environment.
- `CORS_ORIGINS` includes the stable and preview domains only.
- `DATABASE_URL` points to the intended persistent or demo database.
- `REDIS_URL` points to the intended Redis instance.
- `OTEL_EXPORTER_OTLP_ENDPOINT` is correct or intentionally empty.
- Rollback image/tag and database compatibility notes are attached to the release.
