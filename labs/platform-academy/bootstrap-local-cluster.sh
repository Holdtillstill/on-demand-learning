#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_ROOT="$ROOT/labs/platform-academy"
source "$LAB_ROOT/lib/cluster-safety.sh"

cluster_name="platform-lab"
preflight_lab=""
allow_create=true

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/bootstrap-local-cluster.sh [--name <kind-cluster-name>] [--preflight <lab-slug>] [--no-create]

Options:
  --name         kind cluster name to create or reuse. Defaults to platform-lab.
  --preflight    After selecting the disposable context, run setup --preflight for this lab slug.
  --no-create    Do not create a kind cluster; only verify an existing disposable context.

This helper creates or selects kind-<name> when kind is installed. If kind is
not installed, it accepts an already running disposable context such as minikube,
docker-desktop, or rancher-desktop. Lab setup scripts still create their own
namespaces, so no app namespace or Pods need to exist before setup.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name)
      shift
      [[ -n "${1:-}" ]] || fail "--name requires a cluster name"
      cluster_name="$1"
      ;;
    --preflight)
      shift
      [[ -n "${1:-}" ]] || fail "--preflight requires a lab slug"
      preflight_lab="$1"
      ;;
    --no-create)
      allow_create=false
      ;;
    -h|--help|help)
      usage
      exit 0
      ;;
    *)
      fail "unsupported option: $1"
      ;;
  esac
  shift
done

current_disposable_context_ready() {
  command -v kubectl >/dev/null 2>&1 || return 1

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || return 1
  is_disposable_kube_context "$context" || return 1
  kube_cluster_reachable
}

ensure_kind_cluster() {
  command -v kind >/dev/null 2>&1 || return 1
  command -v kubectl >/dev/null 2>&1 || fail_missing_kubectl

  local clusters
  if ! clusters="$(kind get clusters 2>/dev/null)"; then
    fail_cluster_safety \
      "could not list local kind clusters." \
      "Check Docker/Podman availability, then rerun this helper." \
      "$(no_cluster_fallback_hint)"
  fi

  if grep -Fxq "$cluster_name" <<<"$clusters"; then
    echo "Using existing kind cluster: $cluster_name"
  else
    if [[ "$allow_create" != true ]]; then
      echo "kind cluster '$cluster_name' does not exist; checking the current context instead."
      return 1
    fi

    echo "Creating kind cluster: $cluster_name"
    if ! kind create cluster --name "$cluster_name"; then
      fail_cluster_safety \
        "kind could not create cluster '$cluster_name'." \
        "Check Docker/Podman availability and local kind permissions, then rerun this helper." \
        "$(no_cluster_fallback_hint)"
    fi
  fi

  kubectl config use-context "kind-$cluster_name" >/dev/null || fail_cluster_safety \
    "could not select context kind-$cluster_name." \
    "Check configured contexts: kubectl config get-contexts" \
    "$(no_cluster_fallback_hint)"
}

if command -v kind >/dev/null 2>&1 && ensure_kind_cluster; then
  :
elif current_disposable_context_ready; then
  echo "Using current disposable Kubernetes context: $(current_context)"
else
  fail_cluster_safety \
    "no ready disposable Kubernetes context was found." \
    "Install kind, rerun without --no-create, or start minikube, Docker Desktop Kubernetes, or Rancher Desktop and select that context." \
    "Then rerun this helper or run setup --preflight for a specific lab." \
    "$(no_cluster_fallback_hint)"
fi

context="$(current_context)"
[[ -n "$context" ]] || fail_no_current_context
is_disposable_kube_context "$context" || fail_unsafe_kube_context "$context"
kube_cluster_reachable || fail_unreachable_kube_api "$context"

echo "Disposable Kubernetes context is ready: $context"
echo "Lab setup will create its own namespace; no app namespace or Pods need to exist yet."

if [[ -n "$preflight_lab" ]]; then
  echo
  "$LAB_ROOT/run-lab.sh" setup "$preflight_lab" --preflight
else
  echo
  echo "Try a lab preflight:"
  echo "  bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --preflight"
fi
