#!/usr/bin/env bash
set -euo pipefail

log_file="${1:-}"
context="${2:-API smoke}"
pattern="${API_LOG_ERROR_PATTERN:-IntegrityError|UNIQUE constraint failed|request_failed|Traceback}"

if [ -z "${log_file}" ]; then
  echo "Usage: $0 <api-log-file> [context]" >&2
  exit 2
fi

if [ ! -s "${log_file}" ]; then
  echo "API log audit failed for ${context}: log file is missing or empty: ${log_file}" >&2
  exit 1
fi

if grep -En -m 40 "${pattern}" "${log_file}"; then
  message="API emitted errors during ${context}. See ${log_file}."
  if [ "${GITHUB_ACTIONS:-}" = "true" ]; then
    echo "::error::${message}"
  else
    echo "${message}" >&2
  fi
  exit 1
fi

echo "API log audit passed for ${context}"
