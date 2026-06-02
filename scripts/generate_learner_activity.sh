#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8000}"
USER_ID="${USER_ID:-demo-user}"
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-30}"

curl_demo() {
  curl --connect-timeout "${CURL_CONNECT_TIMEOUT}" --max-time "${CURL_MAX_TIME}" -fsS "$@"
}

courses_json="$(curl_demo "${API_BASE}/api/courses")"
lesson_ids="$(printf '%s' "${courses_json}" | python3 -c '
import json
import sys

courses = json.load(sys.stdin)
for course in courses[:4]:
    for lesson in course.get("lessons", [])[:2]:
        print(lesson["id"])
')"

for lesson_id in ${lesson_ids}; do
  curl_demo -X POST "${API_BASE}/api/progress" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${lesson_id},\"completed\":true,\"score\":1}" >/dev/null
  curl_demo -X POST "${API_BASE}/api/quiz/attempts" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${lesson_id},\"score\":0.8,\"answers\":{\"smoke\":\"ok\"}}" >/dev/null
done

due_json="$(curl_demo "${API_BASE}/api/reviews/due?user_id=${USER_ID}")"
card_ids="$(printf '%s' "${due_json}" | python3 -c '
import json
import sys

queue = json.load(sys.stdin)
for card in queue.get("cards", [])[:5]:
    print(card["id"])
')"

for card_id in ${card_ids}; do
  curl_demo -X POST "${API_BASE}/api/reviews/${card_id}/answer" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"quality\":5,\"correct\":true}" >/dev/null
done

curl_demo "${API_BASE}/api/users/${USER_ID}/dashboard" >/dev/null
curl_demo "${API_BASE}/api/learning-path?user_id=${USER_ID}" >/dev/null

platform_courses_json="$(curl_demo "${API_BASE}/api/courses?domain=platform")"
platform_lesson_id="$(printf '%s' "${platform_courses_json}" | python3 -c '
import json
import sys

courses = json.load(sys.stdin)
if courses and courses[0].get("lessons"):
    print(courses[0]["lessons"][0]["id"])
')"

if [[ -n "${platform_lesson_id}" ]]; then
  curl_demo -X POST "${API_BASE}/api/progress" \
    -H 'content-type: application/json' \
    -d "{\"user_id\":\"${USER_ID}\",\"lesson_id\":${platform_lesson_id},\"completed\":true,\"score\":1}" >/dev/null
fi

curl_demo -X POST "${API_BASE}/api/platform-academy/activity" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"target_type\":\"resource\",\"target_id\":\"kubernetes-debugging-cheatsheet\",\"state\":\"completed\"}" >/dev/null
curl_demo -X POST "${API_BASE}/api/platform-academy/activity" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"target_type\":\"interview_question\",\"target_id\":\"kubernetes-debugging-interview-pack:1\",\"state\":\"completed\"}" >/dev/null
curl_demo -X POST "${API_BASE}/api/platform-academy/activity" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"target_type\":\"guest_recovery\",\"target_id\":\"profile-restore\",\"state\":\"completed\"}" >/dev/null
curl_demo -X POST "${API_BASE}/api/platform-academy/labs/trace-service-to-pod/submission" \
  -H 'content-type: application/json' \
  -d "{\"user_id\":\"${USER_ID}\",\"worksheet_answers\":{\"worksheet-0\":\"Service selector and Pod labels differ.\"},\"checked_items\":{\"worksheet-0\":true,\"validation-0\":true},\"status\":\"submitted\"}" >/dev/null
curl_demo "${API_BASE}/api/platform-academy/labs/trace-service-to-pod/packet" >/dev/null
curl_demo "${API_BASE}/api/platform-academy/labs/trace-service-to-pod/bundle" >/dev/null
curl_demo "${API_BASE}/api/users/${USER_ID}/dashboard?domain=platform" >/dev/null

echo "Generated learner activity for ${USER_ID} against ${API_BASE}"
