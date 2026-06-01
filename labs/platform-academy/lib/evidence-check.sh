#!/usr/bin/env bash

require_evidence_file() {
  local evidence_file="$1"

  [[ -f "$evidence_file" ]] || {
    echo "FAIL: evidence file not found: $evidence_file" >&2
    exit 1
  }
  [[ -s "$evidence_file" ]] || {
    echo "FAIL: evidence file is empty: $evidence_file" >&2
    exit 1
  }
}

require_evidence_match() {
  local evidence_file="$1"
  local description="$2"
  local pattern="$3"

  if ! LC_ALL=C grep -Eiq -- "$pattern" "$evidence_file"; then
    echo "FAIL: evidence missing ${description}" >&2
    echo "      expected pattern: $pattern" >&2
    exit 1
  fi
}
