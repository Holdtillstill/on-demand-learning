#!/usr/bin/env bash

current_context() {
  kubectl config current-context 2>/dev/null || true
}

fail_cluster_safety() {
  echo "FAIL: $*" >&2
  exit 1
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
  command -v kubectl >/dev/null 2>&1 || fail_cluster_safety "kubectl is required for cluster mode"

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || fail_cluster_safety "kubectl has no current context"

  if is_disposable_kube_context "$context"; then
    return 0
  fi

  echo "FAIL: refusing to mutate Kubernetes context '$context'." >&2
  echo "Use kind, minikube, Docker Desktop, Rancher Desktop, or set PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 for an approved sandbox." >&2
  exit 1
}

require_kube_permission() {
  local verb="$1"
  local resource="$2"
  local namespace="${3:-}"
  local result

  if [[ -n "$namespace" ]]; then
    result="$(kubectl auth can-i "$verb" "$resource" -n "$namespace" 2>/dev/null || true)"
  else
    result="$(kubectl auth can-i "$verb" "$resource" 2>/dev/null || true)"
  fi

  [[ "$result" == "yes" ]] || fail_cluster_safety "current Kubernetes user cannot $verb $resource${namespace:+ in namespace $namespace}"
  if [[ -n "$namespace" ]]; then
    echo "- Permission: can $verb $resource in $namespace"
  else
    echo "- Permission: can $verb $resource"
  fi
}

kube_cluster_reachable() {
  kubectl version --request-timeout=5s >/dev/null 2>&1
}

preflight_kube_lab() {
  local lab_name="$1"
  local namespace="$2"
  local manifest="$3"
  shift 3

  echo "Kubernetes lab preflight: $lab_name"
  echo "- Target namespace: $namespace"
  echo "- Start manifest: $manifest"
  [[ -f "$manifest" ]] || fail_cluster_safety "start manifest is missing: $manifest"
  echo "- Start manifest exists"

  command -v kubectl >/dev/null 2>&1 || fail_cluster_safety "kubectl is required for cluster mode"
  echo "- kubectl: $(command -v kubectl)"

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || fail_cluster_safety "kubectl has no current context"
  echo "- Current context: $context"

  require_disposable_kube_context
  if [[ "${PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER:-}" == "1" ]]; then
    echo "- Context safety: approved by PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1"
  else
    echo "- Context safety: disposable local context"
  fi

  kube_cluster_reachable || fail_cluster_safety "Kubernetes API is not reachable for context '$context'"
  echo "- API server: reachable"

  require_kube_permission create namespaces
  require_kube_permission delete namespaces
  require_kube_permission get pods "$namespace"
  require_kube_permission get events "$namespace"

  local permission_spec
  local verb
  local resource
  local permission_namespace
  for permission_spec in "$@"; do
    IFS='|' read -r verb resource permission_namespace <<<"$permission_spec"
    [[ -n "$verb" && -n "$resource" ]] || fail_cluster_safety "invalid preflight permission spec: $permission_spec"
    require_kube_permission "$verb" "$resource" "$permission_namespace"
  done

  if kubectl get namespace "$namespace" >/dev/null 2>&1; then
    echo "- Namespace state: $namespace already exists and setup will recreate it"
  else
    echo "- Namespace state: $namespace does not exist yet; setup will create it"
  fi

  echo "- Cleanup: use the lab cleanup script to remove namespace $namespace"
  echo "Preflight passed. No app namespace or Pods need to exist before setup."
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
