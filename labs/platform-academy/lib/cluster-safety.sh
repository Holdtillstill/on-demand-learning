#!/usr/bin/env bash

current_context() {
  kubectl config current-context 2>/dev/null || true
}

fail_cluster_safety() {
  local message="${1:-Kubernetes lab safety check failed}"
  shift || true

  echo "FAIL: $message" >&2
  local detail
  for detail in "$@"; do
    echo "$detail" >&2
  done
  exit 1
}

no_cluster_fallback_hint() {
  echo "No-cluster fallback: rerun the setup command without --cluster or --preflight to use the captured evidence path."
}

fail_missing_kubectl() {
  fail_cluster_safety \
    "kubectl is required for cluster mode." \
    "Install kubectl and point it at a disposable kind, minikube, Docker Desktop, or Rancher Desktop cluster." \
    "$(no_cluster_fallback_hint)"
}

fail_no_current_context() {
  fail_cluster_safety \
    "kubectl has no current context." \
    "Check configured contexts: kubectl config get-contexts" \
    "Create or start a disposable local cluster, then rerun setup --preflight." \
    "$(no_cluster_fallback_hint)"
}

fail_unsafe_kube_context() {
  local context="$1"

  fail_cluster_safety \
    "refusing to mutate Kubernetes context '$context'." \
    "Use kind, minikube, Docker Desktop, Rancher Desktop, or set PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 for an approved sandbox." \
    "$(no_cluster_fallback_hint)"
}

fail_unreachable_kube_api() {
  local context="$1"

  fail_cluster_safety \
    "Kubernetes API is not reachable for context '$context'." \
    "Check the active cluster: kubectl cluster-info" \
    "For kind, check clusters with: kind get clusters" \
    "For minikube, check status with: minikube status" \
    "Then rerun setup --preflight before creating lab resources." \
    "$(no_cluster_fallback_hint)"
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
  command -v kubectl >/dev/null 2>&1 || fail_missing_kubectl

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || fail_no_current_context

  if is_disposable_kube_context "$context"; then
    return 0
  fi

  fail_unsafe_kube_context "$context"
}

kube_can_i_command() {
  local verb="$1"
  local resource="$2"
  local namespace="${3:-}"

  if [[ -n "$namespace" ]]; then
    echo "kubectl auth can-i $verb $resource -n $namespace"
  else
    echo "kubectl auth can-i $verb $resource"
  fi
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

  [[ "$result" == "yes" ]] || fail_cluster_safety \
    "current Kubernetes user cannot $verb $resource${namespace:+ in namespace $namespace}." \
    "Confirm the permission directly: $(kube_can_i_command "$verb" "$resource" "$namespace")" \
    "Use a disposable sandbox context with this permission, or switch to the captured evidence path." \
    "$(no_cluster_fallback_hint)"
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

  command -v kubectl >/dev/null 2>&1 || fail_missing_kubectl
  echo "- kubectl: $(command -v kubectl)"

  local context
  context="$(current_context)"
  [[ -n "$context" ]] || fail_no_current_context
  echo "- Current context: $context"

  require_disposable_kube_context
  if [[ "${PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER:-}" == "1" ]]; then
    echo "- Context safety: approved by PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1"
  else
    echo "- Context safety: disposable local context"
  fi

  kube_cluster_reachable || fail_unreachable_kube_api "$context"
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
  echo "Next: rerun setup with --cluster to create the lab, or omit cluster flags for captured evidence mode."
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
