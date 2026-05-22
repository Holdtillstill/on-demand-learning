#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
USER_ID="${USER_ID:-demo-user}"

courses_json="$(curl -fsS "${API_BASE}/api/courses")"
lesson_ids="$(printf '%s' "${courses_json}" | python3 -c '
import json
import sys

courses = json.load(sys.stdin)
for course in courses[:4]:
    for lesson in course.get("lessons", [])[:2]:
        print(lesson["id"])
')"

for lesson_id in ${lesson_ids}; do
  curl -fsS -X POST "${API_BASE}/api/progress" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${lesson_id},\"completed\":true,\"score\":1}" >/dev/null
  curl -fsS -X POST "${API_BASE}/api/quiz/attempts" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${lesson_id},\"score\":0.8,\"answers\":{\"smoke\":\"ok\"}}" >/dev/null
done

due_json="$(curl -fsS "${API_BASE}/api/reviews/due?user_id=${USER_ID}")"
card_ids="$(printf '%s' "${due_json}" | python3 -c '
import json
import sys

queue = json.load(sys.stdin)
for card in queue.get("cards", [])[:5]:
    print(card["id"])
')"

for card_id in ${card_ids}; do
  curl -fsS -X POST "${API_BASE}/api/reviews/${card_id}/answer" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"quality\":5,\"correct\":true}" >/dev/null
done

curl -fsS "${API_BASE}/api/users/${USER_ID}/dashboard" >/dev/null
curl -fsS "${API_BASE}/api/learning-path?user_id=${USER_ID}" >/dev/null

echo "Generated learner activity for ${USER_ID} against ${API_BASE}"
