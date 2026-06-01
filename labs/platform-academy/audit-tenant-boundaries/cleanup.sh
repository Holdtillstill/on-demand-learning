#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
source "$ROOT/labs/platform-academy/lib/cluster-safety.sh"

delete_namespace_if_disposable tenant-a
