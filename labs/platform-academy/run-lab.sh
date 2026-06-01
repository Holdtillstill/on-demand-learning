#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_ROOT="$ROOT/labs/platform-academy"
PYTHON_BIN="${PYTHON:-}"
if [[ -z "$PYTHON_BIN" ]]; then
  if command -v python3.11 >/dev/null 2>&1; then
    PYTHON_BIN="python3.11"
  elif command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  else
    echo "FAIL: python3.11 or python3 is required" >&2
    exit 1
  fi
fi

CLUSTER_LABS=(
  "trace-service-to-pod"
  "debug-crashloop-imagepull"
)

EVIDENCE_VALIDATION_LABS=(
  "trace-service-to-pod"
  "debug-crashloop-imagepull"
  "review-yaml-before-apply"
  "diagnose-eks-ip-exhaustion"
  "validate-helm-release-artifact"
  "trace-argocd-drift"
  "design-production-eks-review"
  "audit-tenant-boundaries"
  "write-slo-backed-runbook"
  "inspect-linux-failure-evidence"
  "trace-network-path"
  "review-terraform-eks-plan"
  "debug-irsa-access-denied"
  "design-safe-release-pipeline"
  "create-platform-golden-path"
  "review-docker-image-supply-chain"
  "debug-aws-alb-health-path"
  "design-opentelemetry-signal-path"
  "run-incident-commander-tabletop"
  "audit-eks-cost-drivers"
  "build-platform-career-proof-pack"
)

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/run-lab.sh list
  bash labs/platform-academy/run-lab.sh show <lab-slug>
  bash labs/platform-academy/run-lab.sh packet <lab-slug>
  bash labs/platform-academy/run-lab.sh workspace <lab-slug> [--dir <workspace-root>] [--include-solution] [--force]
  bash labs/platform-academy/run-lab.sh setup <lab-slug> [setup flags]
  bash labs/platform-academy/run-lab.sh validate <lab-slug> [--cluster] [--evidence <evidence-file>]
  bash labs/platform-academy/run-lab.sh cleanup <lab-slug>
  bash labs/platform-academy/run-lab.sh verify-all [--cluster]

Examples:
  bash labs/platform-academy/run-lab.sh list
  bash labs/platform-academy/run-lab.sh show trace-service-to-pod
  bash labs/platform-academy/run-lab.sh packet trace-service-to-pod > trace-service-to-pod-lab-packet.md
  bash labs/platform-academy/run-lab.sh workspace trace-service-to-pod --dir /tmp/platform-academy-workspaces
  bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --evidence /tmp/trace-service-evidence.md
  bash labs/platform-academy/run-lab.sh setup trace-service-to-pod --cluster
  bash labs/platform-academy/run-lab.sh validate trace-service-to-pod
  bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --cluster
  bash labs/platform-academy/run-lab.sh validate trace-service-to-pod --evidence /tmp/trace-service-evidence.md
  bash labs/platform-academy/run-lab.sh cleanup trace-service-to-pod

Cluster mode requires a disposable Kubernetes context unless
PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1 is set for an approved sandbox.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

CONTRACT_ARGS=()
case "${PLATFORM_LAB_SKIP_CONTRACT:-false}" in
  true)
    CONTRACT_ARGS=(--skip-contract)
    ;;
  false|"")
    ;;
  *)
    fail "PLATFORM_LAB_SKIP_CONTRACT must be true or false"
    ;;
esac

full_labs() {
  "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" "${CONTRACT_ARGS[@]}" --list-full-lab-slugs
}

is_known_lab() {
  local slug="$1"
  local known_slug
  while IFS= read -r known_slug; do
    [[ "$slug" == "$known_slug" ]] && return 0
  done < <(full_labs)
  return 1
}

is_cluster_lab() {
  local slug="$1"
  local cluster_slug
  for cluster_slug in "${CLUSTER_LABS[@]}"; do
    [[ "$slug" == "$cluster_slug" ]] && return 0
  done
  return 1
}

is_evidence_validation_lab() {
  local slug="$1"
  local evidence_slug
  for evidence_slug in "${EVIDENCE_VALIDATION_LABS[@]}"; do
    [[ "$slug" == "$evidence_slug" ]] && return 0
  done
  return 1
}

require_lab_slug() {
  local slug="${1:-}"
  [[ -n "$slug" ]] || fail "missing lab slug"
  [[ "$slug" =~ ^[a-z0-9][a-z0-9-]*$ ]] || fail "invalid lab slug: $slug"
  is_known_lab "$slug" || fail "unknown lab slug: $slug"
}

generic_setup() {
  local slug="$1"
  shift

  local run_cluster=false
  local evidence_file="/tmp/$slug-evidence.md"
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --no-cluster)
        run_cluster=false
        ;;
      --cluster)
        run_cluster=true
        ;;
      --evidence)
        shift
        [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
        evidence_file="$1"
        ;;
      *)
        fail "unsupported setup option: $1"
        ;;
    esac
    shift
  done

  if [[ "$run_cluster" == true ]]; then
    fail "$slug does not have a cluster-backed setup script"
  fi

  local template="$LAB_ROOT/$slug/evidence-template.md"
  [[ -f "$template" ]] || fail "$slug does not have an evidence template"
  if [[ -s "$evidence_file" ]]; then
    echo "Evidence note already exists: $evidence_file"
  else
    cp "$template" "$evidence_file"
    echo "Created evidence note: $evidence_file"
  fi

  "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" "${CONTRACT_ARGS[@]}" --show-lab "$slug"
  echo
  echo "Next: fill $evidence_file, then run:"
  echo "  bash labs/platform-academy/run-lab.sh validate $slug --evidence $evidence_file"
}

command="${1:-}"
case "$command" in
  list)
    [[ $# -eq 1 ]] || fail "list does not accept extra arguments"
    full_labs
    ;;
  show)
    slug="${2:-}"
    [[ $# -eq 2 ]] || fail "show requires exactly one lab slug"
    require_lab_slug "$slug"
    "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" "${CONTRACT_ARGS[@]}" --show-lab "$slug"
    ;;
  packet)
    slug="${2:-}"
    [[ $# -eq 2 ]] || fail "packet requires exactly one lab slug"
    require_lab_slug "$slug"
    "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" "${CONTRACT_ARGS[@]}" --lab-packet "$slug"
    ;;
  workspace|prepare)
    slug="${2:-}"
    [[ $# -ge 2 ]] || fail "workspace requires <lab-slug> and optional flags"
    require_lab_slug "$slug"
    shift 2
    workspace_dir="/tmp/platform-academy-workspaces"
    workspace_args=()
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --dir|--workspace-dir)
          shift
          [[ -n "${1:-}" ]] || fail "--dir requires a workspace root"
          workspace_dir="$1"
          ;;
        --include-solution|--force)
          workspace_args+=("$1")
          ;;
        *)
          fail "unsupported workspace option: $1"
          ;;
      esac
      shift
    done
    "$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" \
      "${CONTRACT_ARGS[@]}" \
      --write-workspace "$slug" \
      --workspace-dir "$workspace_dir" \
      "${workspace_args[@]}"
    ;;
  setup)
    slug="${2:-}"
    [[ $# -ge 2 ]] || fail "setup requires <lab-slug> and optional setup flags"
    require_lab_slug "$slug"
    setup_script="$LAB_ROOT/$slug/setup.sh"
    shift 2
    if [[ -x "$setup_script" ]]; then
      bash "$setup_script" "$@"
    else
      generic_setup "$slug" "$@"
    fi
    ;;
  validate|run)
    slug="${2:-}"
    [[ $# -ge 2 ]] || fail "validate requires <lab-slug> and optional flags"
    require_lab_slug "$slug"
    shift 2

    run_cluster=false
    evidence_file=""
    validate_args=()
    while [[ $# -gt 0 ]]; do
      case "$1" in
        --cluster)
          run_cluster=true
          validate_args+=("$1")
          ;;
        --evidence)
          shift
          [[ -n "${1:-}" ]] || fail "--evidence requires a file path"
          evidence_file="$1"
          validate_args+=("--evidence" "$evidence_file")
          ;;
        *)
          fail "unsupported validate option: $1"
          ;;
      esac
      shift
    done

    if [[ "$run_cluster" == true ]]; then
      is_cluster_lab "$slug" || fail "$slug does not have a cluster-backed validator"
    fi
    if [[ -n "$evidence_file" ]]; then
      is_evidence_validation_lab "$slug" || fail "$slug does not have evidence-note validation yet"
    fi
    bash "$LAB_ROOT/$slug/validate.sh" "${validate_args[@]}"
    ;;
  cleanup)
    slug="${2:-}"
    [[ $# -eq 2 ]] || fail "cleanup requires exactly one lab slug"
    require_lab_slug "$slug"
    bash "$LAB_ROOT/$slug/cleanup.sh"
    ;;
  verify-all)
    mode="${2:-}"
    [[ $# -le 2 ]] || fail "verify-all accepts only optional --cluster"
    if [[ -n "$mode" ]]; then
      [[ "$mode" == "--cluster" ]] || fail "unsupported verify-all option: $mode"
    fi
    bash "$LAB_ROOT/verify-full-labs.sh" ${mode:+"$mode"}
    ;;
  ""|-h|--help|help)
    usage
    ;;
  *)
    usage >&2
    fail "unknown command: $command"
    ;;
esac
