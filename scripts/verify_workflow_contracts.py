#!/usr/bin/env python3
"""Verify release-critical GitHub Actions workflow contracts."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from yaml_contract import load_single_yaml_document

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_DIR = ROOT / ".github" / "workflows"

EXPECTED_WORKFLOWS = {
    "backend.yml",
    "dependency-audit.yml",
    "docker-build.yml",
    "frontend.yml",
    "platform-academy-image.yml",
    "platform-deployed-smoke.yml",
    "platform-validate.yml",
    "secret-scan.yml",
    "security.yml",
    "deploy-template.yml",
}

IMAGE_WORKFLOW_PATHS = {
    "apps/api/**",
    "apps/platform-academy/**",
    "labs/**",
    "scripts/audit_api_log.sh",
    "scripts/smoke_platform_academy_api.sh",
    "scripts/smoke_platform_academy_labs.sh",
    "scripts/smoke_platform_academy_container.sh",
    "scripts/verify_api_image_migrations.sh",
    ".github/workflows/platform-academy-image.yml",
}

PLATFORM_VALIDATE_COMMANDS = {
    "make script-syntax-check",
    "make smoke-helper-check PYTHON=python3",
    "make doc-link-check PYTHON=python3",
    "make env-contract-check PYTHON=python3",
    "make platform-content-count-check PYTHON=python3",
    "make working-tree-hygiene-check PYTHON=python3",
    "docker compose config --quiet",
    "make k8s-platform-contract PYTHON=python3",
    "make platform-lab-verify PYTHON=python3",
    "make workflow-lint PYTHON=python3",
}

DEPLOYED_SMOKE_INPUTS = {
    "api_base",
    "web_base",
    "smoke_viewports",
    "skip_workbook_flow",
    "skip_lab_details",
    "skip_learning_routes",
    "skip_resource_details",
    "skip_interview_packs",
    "source_bundle_token_required",
}

DEPLOYED_SMOKE_RESOLVE_ENV = {
    "INPUT_API_BASE",
    "INPUT_WEB_BASE",
    "INPUT_SMOKE_VIEWPORTS",
    "INPUT_SKIP_WORKBOOK_FLOW",
    "INPUT_SKIP_LAB_DETAILS",
    "INPUT_SKIP_LEARNING_ROUTES",
    "INPUT_SKIP_RESOURCE_DETAILS",
    "INPUT_SKIP_INTERVIEW_PACKS",
    "INPUT_SOURCE_BUNDLE_TOKEN_REQUIRED",
    "VAR_PLATFORM_API_BASE",
    "VAR_PLATFORM_WEB_BASE",
    "VAR_PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED",
    "SECRET_PLATFORM_SOURCE_BUNDLE_TOKEN",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def workflow(name: str) -> dict[str, Any]:
    return load_single_yaml_document(WORKFLOW_DIR / name)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def steps(data: dict[str, Any], job_name: str, workflow_name: str) -> list[dict[str, Any]]:
    jobs = data.get("jobs")
    require(isinstance(jobs, dict), f"{workflow_name} must define jobs")
    job = jobs.get(job_name)
    require(isinstance(job, dict), f"{workflow_name} must define job {job_name}")
    job_steps = job.get("steps")
    require(isinstance(job_steps, list), f"{workflow_name} job {job_name} must define steps")
    return job_steps


def step_index(job_steps: list[dict[str, Any]], name: str, workflow_name: str) -> int:
    for index, step in enumerate(job_steps):
        if step.get("name") == name:
            return index
    fail(f"{workflow_name} missing step {name!r}")


def step_by_name(job_steps: list[dict[str, Any]], name: str, workflow_name: str) -> dict[str, Any]:
    return job_steps[step_index(job_steps, name, workflow_name)]


def require_run_contains(step: dict[str, Any], needle: str, label: str) -> None:
    run = step.get("run", "")
    require(isinstance(run, str) and needle in run, f"{label} must run {needle}")


def verify_expected_workflows() -> None:
    actual = {path.name for path in WORKFLOW_DIR.glob("*.yml")}
    missing = sorted(EXPECTED_WORKFLOWS - actual)
    extra = sorted(actual - EXPECTED_WORKFLOWS)
    require(not missing, f"missing expected workflows: {missing}")
    require(not extra, f"unexpected workflows without contract review: {extra}")


def verify_platform_image_workflow() -> None:
    name = "platform-academy-image.yml"
    data = workflow(name)
    on_config = data.get("on", {})
    push = on_config.get("push", {}) if isinstance(on_config, dict) else {}
    paths = set(push.get("paths", [])) if isinstance(push, dict) else set()
    missing_paths = sorted(IMAGE_WORKFLOW_PATHS - paths)
    require(not missing_paths, f"{name} push paths missing release dependencies: {missing_paths}")
    require("workflow_dispatch" in on_config, f"{name} must support manual dispatch")

    permissions = data.get("permissions", {})
    require(permissions.get("contents") == "read", f"{name} must keep contents: read permission")
    require(permissions.get("id-token") == "write", f"{name} must keep id-token: write for ECR role assumption")

    publish_steps = steps(data, "publish", name)
    expected_order = [
        "Build API image",
        "Scan API image",
        "Verify API image migrations",
        "Build web image",
        "Scan web image",
        "Smoke built Platform Academy images",
        "Push images",
    ]
    indexes = [step_index(publish_steps, step_name, name) for step_name in expected_order]
    require(indexes == sorted(indexes), f"{name} image publish steps are out of order")
    require(indexes[-1] == len(publish_steps) - 1, f"{name} must push images only after all verification steps")

    build_api = step_by_name(publish_steps, "Build API image", name)
    require(build_api.get("uses") == "docker/build-push-action@v6", f"{name} API build must use docker/build-push-action@v6")
    build_api_with = build_api.get("with", {})
    require(build_api_with.get("file") == "apps/api/Dockerfile", f"{name} API build must use apps/api/Dockerfile")
    require(build_api_with.get("push") is False, f"{name} API build must not push before smoke")
    require(build_api_with.get("load") is True, f"{name} API build must load the local image for smoke")

    build_web = step_by_name(publish_steps, "Build web image", name)
    require(build_web.get("uses") == "docker/build-push-action@v6", f"{name} web build must use docker/build-push-action@v6")
    build_web_with = build_web.get("with", {})
    require(build_web_with.get("file") == "apps/platform-academy/Dockerfile", f"{name} web build must use apps/platform-academy/Dockerfile")
    require(build_web_with.get("push") is False, f"{name} web build must not push before smoke")
    require(build_web_with.get("load") is True, f"{name} web build must load the local image for smoke")

    require_run_contains(
        step_by_name(publish_steps, "Verify API image migrations", name),
        "scripts/verify_api_image_migrations.sh",
        f"{name} migration gate",
    )
    smoke_step = step_by_name(publish_steps, "Smoke built Platform Academy images", name)
    require_run_contains(smoke_step, "SMOKE_SKIP_BUILD=true", f"{name} container smoke")
    require_run_contains(smoke_step, "scripts/smoke_platform_academy_container.sh", f"{name} container smoke")
    push_step = step_by_name(publish_steps, "Push images", name)
    require_run_contains(push_step, "docker push", f"{name} push step")


def verify_docker_build_workflow() -> None:
    name = "docker-build.yml"
    data = workflow(name)
    container_steps = steps(data, "platform-academy-container-smoke", name)
    require_run_contains(
        step_by_name(container_steps, "Verify API image migrations", name),
        "scripts/verify_api_image_migrations.sh",
        f"{name} API image migration step",
    )
    smoke_step = step_by_name(container_steps, "Run Platform Academy container smoke", name)
    require_run_contains(smoke_step, "SMOKE_SKIP_BUILD=true", f"{name} container smoke")
    require_run_contains(smoke_step, "scripts/smoke_platform_academy_container.sh", f"{name} container smoke")


def verify_backend_frontend_smokes() -> None:
    backend = workflow("backend.yml")
    backend_steps = steps(backend, "test", "backend.yml")
    backend_smoke = step_by_name(backend_steps, "Smoke Platform Academy API", "backend.yml")
    require_run_contains(backend_smoke, "scripts/smoke_platform_academy_api.sh", "backend API smoke")
    require_run_contains(backend_smoke, "scripts/audit_api_log.sh", "backend API smoke log audit")

    frontend = workflow("frontend.yml")
    frontend_steps = steps(frontend, "platform-academy-browser-smoke", "frontend.yml")
    browser_smoke = step_by_name(frontend_steps, "Run Platform Academy browser smoke", "frontend.yml")
    require_run_contains(browser_smoke, "npm --prefix apps/platform-academy run smoke:routes", "frontend browser smoke")
    require_run_contains(browser_smoke, "scripts/audit_api_log.sh", "frontend browser smoke log audit")


def verify_platform_validate_workflow() -> None:
    name = "platform-validate.yml"
    validate_steps = steps(workflow(name), "local-platform-contracts", name)
    checkout_step = next((step for step in validate_steps if step.get("uses") == "actions/checkout@v4"), None)
    require(isinstance(checkout_step, dict), f"{name} must use actions/checkout@v4")
    checkout_with = checkout_step.get("with", {})
    require(checkout_with.get("fetch-depth") == 0, f"{name} checkout must use fetch-depth: 0 for branch-aware hygiene")
    runs = {step.get("run") for step in validate_steps if isinstance(step.get("run"), str)}
    missing = sorted(PLATFORM_VALIDATE_COMMANDS - runs)
    require(not missing, f"{name} missing local contract commands: {missing}")


def verify_platform_deployed_smoke_workflow() -> None:
    name = "platform-deployed-smoke.yml"
    data = workflow(name)
    on_config = data.get("on", {})
    require(isinstance(on_config, dict), f"{name} must define event triggers")
    dispatch = on_config.get("workflow_dispatch", {})
    require(isinstance(dispatch, dict), f"{name} must support workflow_dispatch")
    inputs = dispatch.get("inputs", {})
    require(isinstance(inputs, dict), f"{name} workflow_dispatch must define inputs")
    missing_inputs = sorted(DEPLOYED_SMOKE_INPUTS - set(inputs))
    require(not missing_inputs, f"{name} missing workflow_dispatch inputs: {missing_inputs}")
    schedule = on_config.get("schedule", [])
    require(isinstance(schedule, list) and schedule, f"{name} must keep a scheduled smoke trigger")

    permissions = data.get("permissions", {})
    require(permissions.get("contents") == "read", f"{name} must keep contents: read permission")

    jobs = data.get("jobs", {})
    require(isinstance(jobs, dict), f"{name} must define jobs")
    smoke_job = jobs.get("smoke", {})
    require(isinstance(smoke_job, dict), f"{name} must define smoke job")
    require(
        "vars.PLATFORM_API_BASE" in str(smoke_job.get("if", "")),
        f"{name} scheduled smoke should require PLATFORM_API_BASE",
    )

    smoke_steps = steps(data, "smoke", name)
    resolve_step = step_by_name(smoke_steps, "Resolve smoke origins", name)
    resolve_env = resolve_step.get("env", {})
    require(isinstance(resolve_env, dict), f"{name} resolve step must define env")
    missing_env = sorted(DEPLOYED_SMOKE_RESOLVE_ENV - set(resolve_env))
    require(not missing_env, f"{name} resolve step missing env inputs: {missing_env}")
    require_run_contains(resolve_step, "PLATFORM_API_BASE", f"{name} resolve step")
    require_run_contains(resolve_step, "PLATFORM_WEB_BASE", f"{name} resolve step")
    require_run_contains(resolve_step, "PLATFORM_SOURCE_BUNDLE_TOKEN_REQUIRED", f"{name} resolve step")
    require_run_contains(resolve_step, "PLATFORM_SOURCE_BUNDLE_TOKEN secret is required", f"{name} resolve step")
    require_run_contains(resolve_step, "SMOKE_EXPECT_SOURCE_BUNDLE_TOKEN_REQUIRED", f"{name} resolve step")
    for skip_output in [
        "SMOKE_SKIP_WORKBOOK_FLOW",
        "SMOKE_SKIP_ALL_LAB_DETAILS",
        "SMOKE_SKIP_ALL_LEARNING_ROUTES",
        "SMOKE_SKIP_ALL_RESOURCE_DETAILS",
        "SMOKE_SKIP_ALL_INTERVIEW_PACKS",
    ]:
        require_run_contains(resolve_step, skip_output, f"{name} resolve step")

    install_step = step_by_name(smoke_steps, "Install Platform Academy browser dependencies", name)
    require_run_contains(install_step, "npm ci", f"{name} browser install")
    require_run_contains(install_step, "npx playwright install --with-deps chromium", f"{name} browser install")

    run_step = step_by_name(smoke_steps, "Run Platform Academy deployed smoke", name)
    require_run_contains(run_step, "SMOKE_INSTALL_BROWSER_DEPS=false", f"{name} deployed smoke")
    require_run_contains(run_step, "SMOKE_ARTIFACT_DIR", f"{name} deployed smoke")
    require_run_contains(run_step, "scripts/smoke_platform_academy_deployed.sh", f"{name} deployed smoke")
    run_env = run_step.get("env", {})
    require(isinstance(run_env, dict), f"{name} deployed smoke step must define env")
    require("PLATFORM_SOURCE_BUNDLE_TOKEN" in run_env, f"{name} deployed smoke must pass source bundle token secret")

    upload_step = step_by_name(smoke_steps, "Upload deployed browser smoke artifacts", name)
    upload_with = upload_step.get("with", {})
    require(upload_with.get("path") == "smoke-artifacts", f"{name} artifact upload must collect smoke-artifacts")

    summary_step = step_by_name(smoke_steps, "Write smoke summary", name)
    require_run_contains(summary_step, "Source bundle token gate expected", f"{name} summary")


def main() -> None:
    verify_expected_workflows()
    verify_platform_image_workflow()
    verify_docker_build_workflow()
    verify_backend_frontend_smokes()
    verify_platform_validate_workflow()
    verify_platform_deployed_smoke_workflow()
    print("Verified GitHub Actions release workflow contracts.")


if __name__ == "__main__":
    main()
