#!/usr/bin/env bash

current_context() {
  kubectl config current-context 2>/dev/null || true
}

is_disposable_kube_context() {
  local context="$1"

  if [[ "${PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER:-}" == "1" ]]; then
    return 0
  fi

  case "$context" in
    kind-*|minikube|docker-desktop|rancher-desktop)
      return 0
      ;;
  esac

  return 1
}

require_disposable_kube_context() {
  command -v kubectl >/dev/null 2>&1 || {
    echo "FAIL: kubectl is required for cluster mode" >&2
    exit 1
  }

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || {
    echo "FAIL: kubectl has no current context" >&2
    exit 1
  }

  if is_disposable_kube_context "$context"; then
    return 0
  fi

  echo "FAIL: refusing to mutate Kubernetes context '$context'." >&2
  echo "Use kind, minikube, Docker Desktop, Rancher Desktop, or set PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 for an approved sandbox." >&2
  exit 1
}

delete_namespace_if_disposable() {
  local namespace="$1"

  if ! command -v kubectl >/dev/null 2>&1; then
    echo "No Kubernetes cleanup performed: kubectl is not installed."
    return 0
  fi

  local context
  context="$(current_context)"
  if [[ -z "$context" ]]; then
    echo "No Kubernetes cleanup performed: kubectl has no current context."
    return 0
  fi

  if ! is_disposable_kube_context "$context"; then
    echo "No Kubernetes cleanup performed: refusing to mutate context '$context'."
    echo "Use kind, minikube, Docker Desktop, Rancher Desktop, or set PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 for an approved sandbox."
    return 0
  fi

  kubectl delete namespace "$namespace" --ignore-not-found
}

delete_clusterrolebinding_if_disposable() {
  local binding="$1"

  if ! command -v kubectl >/dev/null 2>&1; then
    echo "No Kubernetes cleanup performed: kubectl is not installed."
    return 0
  fi

  local context
  context="$(current_context)"
  if [[ -z "$context" ]]; then
    echo "No Kubernetes cleanup performed: kubectl has no current context."
    return 0
  fi

  if ! is_disposable_kube_context "$context"; then
    echo "No Kubernetes cleanup performed: refusing to mutate context '$context'."
    echo "Use kind, minikube, Docker Desktop, Rancher Desktop, or set PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 for an approved sandbox."
    return 0
  fi

  kubectl delete clusterrolebinding "$binding" --ignore-not-found
}
