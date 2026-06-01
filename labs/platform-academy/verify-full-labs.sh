#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAB_ROOT="$ROOT/labs/platform-academy"
if [ -n "${PYTHON:-}" ]; then
  PYTHON_BIN="$PYTHON"
elif command -v python3.11 >/dev/null 2>&1; then
  PYTHON_BIN="python3.11"
else
  PYTHON_BIN="python3"
fi
source "$LAB_ROOT/lib/cluster-safety.sh"
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

usage() {
  cat <<'EOF'
Usage:
  bash labs/platform-academy/verify-full-labs.sh [--cluster]

Without flags, verifies every full lab's repo artifacts, local runner paths,
learner workspace generation, workspace file-only validation, packet output,
and evidence-note validation using captured/local-safe artifacts.

With --cluster, also runs cluster-backed validators for the local-cluster labs
after confirming the current Kubernetes context is disposable.
EOF
}

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

run_cluster=false
case "$#" in
  0)
    ;;
  1)
    case "${1:-}" in
      --cluster)
        run_cluster=true
        ;;
      -h|--help|help)
        usage
        exit 0
        ;;
      *)
        usage >&2
        fail "unsupported option: $1"
        ;;
    esac
    ;;
  *)
    usage >&2
    fail "too many arguments"
    ;;
esac

FULL_LABS=()
while IFS= read -r lab; do
  [[ -n "$lab" ]] && FULL_LABS+=("$lab")
done < <("$PYTHON_BIN" "$ROOT/scripts/verify_platform_lab_contract.py" --list-full-lab-slugs)
export PLATFORM_LAB_SKIP_CONTRACT=true

CLUSTER_LABS=(
  "trace-service-to-pod"
  "debug-crashloop-imagepull"
  "trace-network-path"
  "debug-aws-alb-health-path"
  "audit-tenant-boundaries"
)

TRANSCRIPT_SETUP_LABS=(
  "trace-service-to-pod"
  "debug-crashloop-imagepull"
)

PREFLIGHT_SETUP_LABS=(
  "trace-service-to-pod"
  "debug-crashloop-imagepull"
  "trace-network-path"
  "debug-aws-alb-health-path"
  "audit-tenant-boundaries"
)

fake_kubectl_bin="$tmpdir/fakebin"
mkdir -p "$fake_kubectl_bin"
cat >"$fake_kubectl_bin/kubectl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

: "${PLATFORM_FAKE_KUBECTL_LOG:?}"
printf "%s\n" "$*" >>"$PLATFORM_FAKE_KUBECTL_LOG"
state_file="${PLATFORM_FAKE_KUBECTL_STATE:-$PLATFORM_FAKE_KUBECTL_LOG.state}"
touch "$state_file"

set_state() {
  printf "%s=%s\n" "$1" "$2" >>"$state_file"
}

get_state() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { value = $2 } END { print value }' "$state_file"
}

case "${1:-}" in
  config)
    if [[ "${2:-}" == "current-context" ]]; then
      echo "kind-platform-lab"
      exit 0
    fi
    if [[ "${2:-}" == "use-context" ]]; then
      echo "Switched to context \"${3:-}\"."
      exit 0
    fi
    ;;
  version)
    exit 0
    ;;
  auth)
    if [[ "${2:-}" == "can-i" ]]; then
      verb="${3:-}"
      resource="${4:-}"
      namespace=""
      shift 4
      while [[ $# -gt 0 ]]; do
        if [[ "${1:-}" == "-n" ]]; then
          shift
          namespace="${1:-}"
        fi
        shift || true
      done
      if [[ "$verb|$resource|$namespace" == "get|secrets|tenant-a" ]] && [[ "$(get_state tenant)" == "fixed" ]]; then
        echo "no"
        exit 0
      fi
      if [[ "${PLATFORM_FAKE_KUBECTL_DENY:-}" == "$verb|$resource|$namespace" ]]; then
        echo "no"
      else
        echo "yes"
      fi
      exit 0
    fi
    ;;
  delete)
    if [[ "${2:-}" == "clusterrolebinding" && "${3:-}" == "tenant-a-temporary-admin" ]]; then
      set_state tenant_binding deleted
    fi
    exit 0
    ;;
  apply)
    if [[ "${2:-}" == "-f" ]]; then
      manifest="${3:-}"
      case "$manifest" in
        */trace-service-to-pod/start.yaml)
          set_state service_endpoint empty
          ;;
        */trace-service-to-pod/fixed.yaml)
          set_state service_endpoint ready
          ;;
        */debug-crashloop-imagepull/start.yaml)
          set_state crashloop broken
          ;;
        */debug-crashloop-imagepull/fixed.yaml)
          set_state crashloop fixed
          ;;
        */trace-network-path/ingress-service.yaml)
          set_state route_target_port web
          set_state endpoint_port none
          ;;
        */trace-network-path/fixed-ingress-service.yaml)
          set_state route_target_port http
          set_state endpoint_port 8080
          ;;
        */debug-aws-alb-health-path/ingress-service.yaml)
          set_state route_target_port web
          set_state alb_health_path /healthz
          set_state endpoint_port none
          ;;
        */debug-aws-alb-health-path/fixed-ingress-service.yaml)
          set_state route_target_port http
          set_state alb_health_path /
          set_state endpoint_port 8080
          ;;
        */audit-tenant-boundaries/tenant-a.yaml)
          set_state tenant broken
          set_state tenant_binding present
          ;;
        */audit-tenant-boundaries/fixed-tenant-a.yaml)
          set_state tenant fixed
          ;;
      esac
      exit 0
    fi
    ;;
  rollout)
    exit 0
    ;;
  wait)
    exit 0
    ;;
  logs)
    echo "missing DB_URL"
    exit 0
    ;;
  exec)
    if [[ "$*" == *"/healthz"* ]]; then
      echo "404"
    else
      echo "200"
    fi
    exit 0
    ;;
  get)
    if [[ "${2:-}" == "namespace" ]]; then
      if [[ "${3:-}" == "tenant-a" ]] && [[ "$*" == *"jsonpath"* ]]; then
        if [[ "$(get_state tenant)" == "fixed" ]]; then
          echo "restricted"
        else
          echo "baseline"
        fi
        exit 0
      fi
      echo "Error from server (NotFound): namespaces \"${3:-}\" not found" >&2
      exit 1
    fi
    if [[ "${2:-}" == "clusterrolebinding" && "${3:-}" == "tenant-a-temporary-admin" ]]; then
      if [[ "$(get_state tenant_binding)" == "present" ]]; then
        if [[ "$*" == *"jsonpath"* ]]; then
          echo "cluster-admin"
        fi
        exit 0
      fi
      exit 1
    fi
    if [[ "${2:-}" == "networkpolicy" ]]; then
      if [[ "${3:-}" == "allow-all-egress" ]]; then
        echo "egress:"
      else
        echo "networkpolicy.networking.k8s.io/${3:-default-deny-egress}"
      fi
      exit 0
    fi
    if [[ "${2:-}" == "pods" ]]; then
      if [[ "$*" == *"app=checkout-crash"* ]]; then
        echo "CrashLoopBackOff"
      elif [[ "$*" == *"app=checkout-pull"* ]]; then
        echo "ImagePullBackOff"
      else
        echo "pod/checkout-example"
      fi
      exit 0
    fi
    if [[ "${2:-}" == "svc" && "${3:-}" == "checkout" ]]; then
      if [[ "$*" == *"jsonpath"* ]]; then
        echo "$(get_state route_target_port)"
      else
        echo "service/checkout"
      fi
      exit 0
    fi
    if [[ "${2:-}" == "ingress" && "${3:-}" == "checkout" ]]; then
      if [[ "$*" == *"jsonpath"* ]]; then
        echo "$(get_state alb_health_path)"
      else
        echo "ingress.networking.k8s.io/checkout"
      fi
      exit 0
    fi
    if [[ "${2:-}" == "endpointslice" ]]; then
      if [[ "$*" == *".items[*].endpoints[*].addresses[*]"* ]]; then
        [[ "$(get_state service_endpoint)" == "ready" ]] && echo "10.0.0.10"
      elif [[ "$*" == *".items[*].ports[*].port"* ]]; then
        [[ "$(get_state endpoint_port)" == "8080" ]] && echo "8080"
      else
        echo "endpointslice.discovery.k8s.io/checkout-abc"
      fi
      exit 0
    fi
    if [[ "${2:-}" == "svc,endpointslice" || "${2:-}" == "ingress,svc,endpointslice,pod" || "${2:-}" == "namespace,role,rolebinding,networkpolicy" ]]; then
      echo "fake wide output"
      exit 0
    fi
    ;;
esac

echo "fake kubectl unsupported command: $*" >&2
exit 64
EOF
chmod +x "$fake_kubectl_bin/kubectl"

cat >"$fake_kubectl_bin/kind" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

: "${PLATFORM_FAKE_KIND_LOG:?}"
printf "%s\n" "$*" >>"$PLATFORM_FAKE_KIND_LOG"

case "${1:-} ${2:-}" in
  "get clusters")
    if [[ "${PLATFORM_FAKE_KIND_HAS_CLUSTER:-false}" == "true" ]]; then
      echo "platform-lab"
    fi
    exit 0
    ;;
  "create cluster")
    if [[ "${3:-}" == "--name" && -n "${4:-}" ]]; then
      echo "Created fake kind cluster ${4:-}"
      exit 0
    fi
    ;;
esac

echo "fake kind unsupported command: $*" >&2
exit 64
EOF
chmod +x "$fake_kubectl_bin/kind"

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

printf "%s\n" "${FULL_LABS[@]}" | sort >"$tmpdir/expected-labs.txt"
find "$LAB_ROOT" -mindepth 2 -maxdepth 2 -name validate.sh -print \
  | awk -F/ '{print $(NF-1)}' \
  | sort >"$tmpdir/actual-labs.txt"
if ! diff -u "$tmpdir/expected-labs.txt" "$tmpdir/actual-labs.txt"; then
  fail "full lab verifier list does not match lab directories with validate.sh"
fi

"$LAB_ROOT/run-lab.sh" list | sort >"$tmpdir/runner-labs.txt"
if ! diff -u "$tmpdir/expected-labs.txt" "$tmpdir/runner-labs.txt"; then
  fail "lab runner list does not match full lab catalog"
fi

"$LAB_ROOT/run-lab.sh" validate trace-service-to-pod >"$tmpdir/runner-validate.txt"
grep -q "File checks passed for trace-service-to-pod" "$tmpdir/runner-validate.txt" || fail "lab runner did not validate trace-service-to-pod"

for workspace_lab in "${FULL_LABS[@]}"; do
  "$LAB_ROOT/run-lab.sh" workspace "$workspace_lab" --dir "$tmpdir/workspaces" >"$tmpdir/runner-workspace-$workspace_lab.txt"
  workspace_dir="$tmpdir/workspaces/$workspace_lab"
  [[ -s "$workspace_dir/README.md" ]] || fail "workspace README missing for $workspace_lab"
  [[ -s "$workspace_dir/evidence.md" ]] || fail "workspace evidence note missing for $workspace_lab"
  [[ -s "$workspace_dir/MANIFEST.txt" ]] || fail "workspace manifest missing for $workspace_lab"
  [[ -d "$workspace_dir/artifacts" ]] || fail "workspace artifacts directory missing for $workspace_lab"
  for script in setup.sh validate.sh cleanup.sh; do
    [[ -x "$workspace_dir/$script" ]] || fail "workspace $script missing or not executable for $workspace_lab"
    bash -n "$workspace_dir/$script"
  done
  grep -q "./validate.sh --files-only" "$workspace_dir/MANIFEST.txt" || fail "workspace manifest should include file-only validation for $workspace_lab"
  "$workspace_dir/validate.sh" --files-only >"$tmpdir/workspace-files-only-$workspace_lab.txt"
  grep -q "File checks passed for $workspace_lab" "$tmpdir/workspace-files-only-$workspace_lab.txt" || fail "workspace file-only validation did not pass for $workspace_lab"
  [[ ! -e "$workspace_dir/artifacts/labs/platform-academy/$workspace_lab/README.md" ]] || fail "workspace should withhold source README.md by default for $workspace_lab"
  [[ ! -e "$workspace_dir/artifacts/labs/platform-academy/$workspace_lab/solution.md" ]] || fail "workspace should withhold solution.md by default for $workspace_lab"
  grep -q "Withheld source-only artifacts" "$workspace_dir/MANIFEST.txt" || fail "workspace manifest should list withheld source-only artifacts for $workspace_lab"
  grep -q "labs/platform-academy/$workspace_lab/README.md" "$workspace_dir/MANIFEST.txt" || fail "workspace manifest should list withheld source README.md for $workspace_lab"
  grep -q "labs/platform-academy/$workspace_lab/solution.md" "$workspace_dir/MANIFEST.txt" || fail "workspace manifest should list withheld solution.md for $workspace_lab"
done

if "$LAB_ROOT/run-lab.sh" workspace trace-service-to-pod --dir "$tmpdir/workspaces" >"$tmpdir/runner-workspace-existing.txt" 2>&1; then
  fail "workspace command should refuse to overwrite an existing workspace without --force"
fi
grep -q "already exists and is not empty" "$tmpdir/runner-workspace-existing.txt" || fail "workspace overwrite refusal returned an unexpected message"

"$LAB_ROOT/run-lab.sh" workspace trace-service-to-pod --dir "$tmpdir/solution-workspaces" --include-solution >"$tmpdir/runner-workspace-solution.txt"
[[ -s "$tmpdir/solution-workspaces/trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/README.md" ]] || fail "workspace --include-solution should copy source README.md"
[[ -s "$tmpdir/solution-workspaces/trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/solution.md" ]] || fail "workspace --include-solution should copy solution.md"

for setup_lab in "${PREFLIGHT_SETUP_LABS[@]}"; do
  setup_script="$LAB_ROOT/$setup_lab/setup.sh"
  [[ -x "$setup_script" ]] || fail "$setup_lab/setup.sh is missing or not executable"
  bash -n "$setup_script"
  "$setup_script" --help >"$tmpdir/setup-help-$setup_lab.txt"
  grep -q -- "--preflight" "$tmpdir/setup-help-$setup_lab.txt" || fail "$setup_lab setup help should include --preflight"
  grep -q "preflight_kube_lab" "$setup_script" || fail "$setup_lab setup should run the shared Kubernetes preflight before cluster setup"

  fake_log="$tmpdir/preflight-$setup_lab-kubectl.log"
  : >"$fake_log"
  PATH="$fake_kubectl_bin:$PATH" \
    PLATFORM_FAKE_KUBECTL_LOG="$fake_log" \
    "$setup_script" --preflight >"$tmpdir/setup-preflight-$setup_lab.txt"
  grep -q "Preflight passed. No app namespace or Pods need to exist before setup." "$tmpdir/setup-preflight-$setup_lab.txt" || fail "$setup_lab preflight should explain namespace setup"
  grep -q "Next: rerun setup with --cluster" "$tmpdir/setup-preflight-$setup_lab.txt" || fail "$setup_lab preflight should print the cluster setup next step"
  ! grep -Eq "^(apply|delete)($| )" "$fake_log" || fail "$setup_lab preflight should not mutate the fake cluster"
done

bootstrap_script="$LAB_ROOT/bootstrap-local-cluster.sh"
[[ -x "$bootstrap_script" ]] || fail "bootstrap-local-cluster.sh should be executable"
bash -n "$bootstrap_script"
"$bootstrap_script" --help >"$tmpdir/bootstrap-help.txt"
grep -q -- "--preflight" "$tmpdir/bootstrap-help.txt" || fail "bootstrap helper help should include --preflight"
grep -q "no app namespace or Pods need to exist" "$tmpdir/bootstrap-help.txt" || fail "bootstrap helper help should explain namespace creation"

bootstrap_kubectl_log="$tmpdir/bootstrap-kubectl.log"
bootstrap_kind_log="$tmpdir/bootstrap-kind.log"
: >"$bootstrap_kubectl_log"
: >"$bootstrap_kind_log"
PATH="$fake_kubectl_bin:$PATH" \
  PLATFORM_FAKE_KUBECTL_LOG="$bootstrap_kubectl_log" \
  PLATFORM_FAKE_KIND_LOG="$bootstrap_kind_log" \
  "$bootstrap_script" --name platform-lab --preflight trace-service-to-pod >"$tmpdir/bootstrap-preflight.txt"
grep -q "Creating kind cluster: platform-lab" "$tmpdir/bootstrap-preflight.txt" || fail "bootstrap helper should create the default kind cluster when absent"
grep -q "Disposable Kubernetes context is ready: kind-platform-lab" "$tmpdir/bootstrap-preflight.txt" || fail "bootstrap helper should confirm the disposable context"
grep -q "Preflight passed. No app namespace or Pods need to exist before setup." "$tmpdir/bootstrap-preflight.txt" || fail "bootstrap helper should run the requested lab preflight"
grep -q "create cluster --name platform-lab" "$bootstrap_kind_log" || fail "bootstrap helper should call kind create cluster"
! grep -Eq "^(apply|delete)($| )" "$bootstrap_kubectl_log" || fail "bootstrap helper preflight should not mutate the fake cluster"

denied_log="$tmpdir/preflight-denied-kubectl.log"
: >"$denied_log"
if PATH="$fake_kubectl_bin:$PATH" \
  PLATFORM_FAKE_KUBECTL_LOG="$denied_log" \
  PLATFORM_FAKE_KUBECTL_DENY="create|services|payments" \
  "$LAB_ROOT/trace-service-to-pod/setup.sh" --preflight >"$tmpdir/setup-preflight-denied.txt" 2>&1; then
  fail "preflight should reject missing Kubernetes permissions"
fi
grep -q "Confirm the permission directly: kubectl auth can-i create services -n payments" "$tmpdir/setup-preflight-denied.txt" || fail "preflight permission failure should include the exact can-i command"
grep -q "without --cluster or --preflight" "$tmpdir/setup-preflight-denied.txt" || fail "preflight permission failure should include the captured-evidence fallback"

for setup_lab in "${TRANSCRIPT_SETUP_LABS[@]}"; do
  "$LAB_ROOT/run-lab.sh" setup "$setup_lab" --evidence "$tmpdir/$setup_lab-evidence.md" >"$tmpdir/runner-setup-$setup_lab.txt"
  [[ -s "$tmpdir/$setup_lab-evidence.md" ]] || fail "lab runner setup did not create evidence note for $setup_lab"
  grep -q "Captured broken-state transcript" "$tmpdir/runner-setup-$setup_lab.txt" || fail "lab runner setup did not print transcript for $setup_lab"
done

for setup_lab in "${FULL_LABS[@]}"; do
  "$LAB_ROOT/run-lab.sh" setup "$setup_lab" --no-cluster --evidence "$tmpdir/generic-$setup_lab-evidence.md" >"$tmpdir/runner-generic-setup-$setup_lab.txt"
  [[ -s "$tmpdir/generic-$setup_lab-evidence.md" ]] || fail "generic setup did not create evidence note for $setup_lab"
  grep -q "Next: fill $tmpdir/generic-$setup_lab-evidence.md" "$tmpdir/runner-generic-setup-$setup_lab.txt" || fail "generic setup did not print next validation step for $setup_lab"
done

for evidence_lab in "${EVIDENCE_VALIDATION_LABS[@]}"; do
  "$LAB_ROOT/run-lab.sh" validate "$evidence_lab" --evidence "$LAB_ROOT/$evidence_lab/solution.md" >"$tmpdir/runner-evidence-$evidence_lab.txt"
  grep -q "Evidence checks passed for $evidence_lab" "$tmpdir/runner-evidence-$evidence_lab.txt" || fail "lab runner did not validate $evidence_lab evidence"
done

touch "$tmpdir/empty-evidence.md"
if "$LAB_ROOT/run-lab.sh" validate trace-service-to-pod --evidence "$tmpdir/empty-evidence.md" >"$tmpdir/runner-evidence-negative.txt" 2>&1; then
  fail "lab runner should reject empty evidence notes"
fi
grep -q "evidence file is empty" "$tmpdir/runner-evidence-negative.txt" || fail "lab runner evidence negative path returned an unexpected message"

"$LAB_ROOT/run-lab.sh" show trace-service-to-pod >"$tmpdir/runner-show.txt"
grep -q "Lab: Trace Service traffic to ready Pods" "$tmpdir/runner-show.txt" || fail "lab runner show did not print the lab title"
grep -q "Evidence templates:" "$tmpdir/runner-show.txt" || fail "lab runner show did not print evidence templates"
grep -q "labs/platform-academy/trace-service-to-pod/evidence-template.md" "$tmpdir/runner-show.txt" || fail "lab runner show did not print the evidence template path"
grep -q "Local validate: bash labs/platform-academy/run-lab.sh validate trace-service-to-pod" "$tmpdir/runner-show.txt" || fail "lab runner show did not print local validate help"

"$LAB_ROOT/run-lab.sh" packet trace-service-to-pod >"$tmpdir/runner-packet.md"
grep -q "# Trace Service traffic to ready Pods" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print the lab packet title"
grep -q "## Learner artifact paths" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print learner artifact paths"
grep -q "labs/platform-academy/trace-service-to-pod/start.yaml" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print learner artifacts"
! grep -q "solution.md" "$tmpdir/runner-packet.md" || fail "lab runner packet should not expose solution.md"
grep -q "## Worksheet prompts" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print worksheet prompts"
grep -q "## Validation checks" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print validation checks"
grep -q "## Rubric" "$tmpdir/runner-packet.md" || fail "lab runner packet did not print the rubric"

if "$LAB_ROOT/run-lab.sh" validate review-yaml-before-apply --cluster >"$tmpdir/runner-negative.txt" 2>&1; then
  fail "lab runner should reject cluster mode for a non-cluster lab"
fi
grep -q "does not have a cluster-backed validator" "$tmpdir/runner-negative.txt" || fail "lab runner negative path returned an unexpected message"

for cluster_lab in "${CLUSTER_LABS[@]}"; do
  fake_log="$tmpdir/runner-cluster-$cluster_lab-kubectl.log"
  fake_state="$tmpdir/runner-cluster-$cluster_lab-kubectl.state"
  : >"$fake_log"
  : >"$fake_state"
  PATH="$fake_kubectl_bin:$PATH" \
    PLATFORM_FAKE_KUBECTL_LOG="$fake_log" \
    PLATFORM_FAKE_KUBECTL_STATE="$fake_state" \
    "$LAB_ROOT/run-lab.sh" validate "$cluster_lab" --cluster >"$tmpdir/runner-cluster-$cluster_lab.txt"
  grep -q "File checks passed for $cluster_lab" "$tmpdir/runner-cluster-$cluster_lab.txt" || fail "$cluster_lab runner cluster validation should run file checks before cluster checks"
  grep -q "^apply -f " "$fake_log" || fail "$cluster_lab runner cluster validation should apply manifests through the fake cluster"
done

for lab in "${FULL_LABS[@]}"; do
  lab_dir="$LAB_ROOT/$lab"
  [[ -d "$lab_dir" ]] || fail "$lab_dir is missing"
  for file in README.md solution.md validate.sh cleanup.sh; do
    [[ -f "$lab_dir/$file" ]] || fail "$lab/$file is missing"
  done
  for script in validate.sh cleanup.sh; do
    [[ -x "$lab_dir/$script" ]] || fail "$lab/$script is not executable"
    bash -n "$lab_dir/$script"
  done
  if [[ -f "$lab_dir/setup.sh" ]]; then
    [[ -x "$lab_dir/setup.sh" ]] || fail "$lab/setup.sh is not executable"
    bash -n "$lab_dir/setup.sh"
  fi
  bash "$lab_dir/validate.sh"
done

if [[ "$run_cluster" == true ]]; then
  require_disposable_kube_context
  for lab in "${CLUSTER_LABS[@]}"; do
    bash "$LAB_ROOT/$lab/validate.sh" --cluster
    bash "$LAB_ROOT/$lab/cleanup.sh"
  done
fi

echo "Verified ${#FULL_LABS[@]} full labs."
