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
    "codeql.yml",
    "dependency-audit.yml",
    "docker-build.yml",
    "platform-academy-frontend.yml",
    "platform-academy-image.yml",
    "platform-static-deploy.yml",
    "platform-deployed-smoke.yml",
    "platform-static-smoke.yml",
    "platform-validate.yml",
    "secret-scan.yml",
    "security.yml",
    "deploy-template.yml",
}

PLATFORM_VALIDATE_COMMANDS = {
    "make script-syntax-check",
    "make smoke-helper-check PYTHON=python3",
    "make doc-link-check PYTHON=python3",
    "make env-contract-check PYTHON=python3",
    "make platform-content-count-check PYTHON=python3",
    "make working-tree-hygiene-check PYTHON=python3",
    "docker compose config --quiet",
    "make terraform-validate",
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

STATIC_SMOKE_INPUTS = {
    "web_base",
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
    workflow_text = (WORKFLOW_DIR / name).read_text()
    require("vars.AWS_ROLE_TO_ASSUME" not in workflow_text, f"{name} must not expose AWS role ARN through repository variables")
    on_config = data.get("on", {})
    require("push" not in on_config, f"{name} must be manual-only because it pushes ECR images")
    require("workflow_dispatch" in on_config, f"{name} must support manual dispatch")

    permissions = data.get("permissions", {})
    require(permissions.get("contents") == "read", f"{name} must keep contents: read permission")
    require(permissions.get("id-token") == "write", f"{name} must keep id-token: write for ECR role assumption")
    require(data.get("concurrency", {}).get("group") == "platform-academy-image-publish", f"{name} must serialize image publishes")

    publish_steps = steps(data, "publish", name)
    configure_aws = next((step for step in publish_steps if step.get("uses") == "aws-actions/configure-aws-credentials@v6"), None)
    require(isinstance(configure_aws, dict), f"{name} must configure AWS credentials before ECR login")
    configure_with = configure_aws.get("with", {})
    require(
        configure_with.get("role-to-assume") == "${{ secrets.AWS_ROLE_TO_ASSUME }}",
        f"{name} must read AWS_ROLE_TO_ASSUME from repository secrets",
    )
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

    frontend = workflow("platform-academy-frontend.yml")
    frontend_steps = steps(frontend, "platform-academy-browser-smoke", "platform-academy-frontend.yml")
    browser_smoke = step_by_name(frontend_steps, "Run Platform Academy browser smoke", "platform-academy-frontend.yml")
    require_run_contains(browser_smoke, "npm --prefix apps/platform-academy run smoke:routes", "platform academy frontend browser smoke")
    require_run_contains(browser_smoke, "scripts/audit_api_log.sh", "platform academy frontend browser smoke log audit")


def verify_platform_validate_workflow() -> None:
    name = "platform-validate.yml"
    validate_steps = steps(workflow(name), "local-platform-contracts", name)
    checkout_step = next((step for step in validate_steps if step.get("uses") == "actions/checkout@v6"), None)
    require(isinstance(checkout_step, dict), f"{name} must use actions/checkout@v6")
    checkout_with = checkout_step.get("with", {})
    require(checkout_with.get("fetch-depth") == 0, f"{name} checkout must use fetch-depth: 0 for branch-aware hygiene")
    runs = {step.get("run") for step in validate_steps if isinstance(step.get("run"), str)}
    missing = sorted(PLATFORM_VALIDATE_COMMANDS - runs)
    require(not missing, f"{name} missing local contract commands: {missing}")
    setup_terraform = next((step for step in validate_steps if step.get("uses") == "hashicorp/setup-terraform@v4"), None)
    require(isinstance(setup_terraform, dict), f"{name} must install Terraform before make terraform-validate")


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


def verify_platform_static_smoke_workflow() -> None:
    name = "platform-static-smoke.yml"
    data = workflow(name)
    workflow_text = (WORKFLOW_DIR / name).read_text()
    require("PLATFORM_API_BASE" not in workflow_text, f"{name} must not require a live API base")

    on_config = data.get("on", {})
    require(isinstance(on_config, dict), f"{name} must define event triggers")
    dispatch = on_config.get("workflow_dispatch", {})
    require(isinstance(dispatch, dict), f"{name} must support workflow_dispatch")
    inputs = dispatch.get("inputs", {})
    require(isinstance(inputs, dict), f"{name} workflow_dispatch must define inputs")
    missing_inputs = sorted(STATIC_SMOKE_INPUTS - set(inputs))
    require(not missing_inputs, f"{name} missing workflow_dispatch inputs: {missing_inputs}")
    schedule = on_config.get("schedule", [])
    require(isinstance(schedule, list) and schedule, f"{name} must keep a scheduled smoke trigger")

    permissions = data.get("permissions", {})
    require(permissions.get("contents") == "read", f"{name} must keep contents: read permission")

    jobs = data.get("jobs", {})
    require(isinstance(jobs, dict), f"{name} must define jobs")
    smoke_job = jobs.get("smoke-static", {})
    require(isinstance(smoke_job, dict), f"{name} must define smoke-static job")
    env = smoke_job.get("env", {})
    require(isinstance(env, dict), f"{name} smoke-static job must define env")
    require("PLATFORM_STATIC_WEB_BASE" in str(env.get("WEB_BASE", "")), f"{name} should support PLATFORM_STATIC_WEB_BASE")
    require("https://platform-academy.bozhi.dev" in str(env.get("WEB_BASE", "")), f"{name} should default to the stable static host")

    smoke_steps = steps(data, "smoke-static", name)
    install_step = step_by_name(smoke_steps, "Install Platform Academy browser dependencies", name)
    require_run_contains(install_step, "npm ci", f"{name} browser install")
    require_run_contains(install_step, "npx playwright install --with-deps chromium", f"{name} browser install")
    require(install_step.get("working-directory") == "apps/platform-academy", f"{name} browser install must run from apps/platform-academy")
    smoke_step = step_by_name(smoke_steps, "Smoke Platform Academy static host", name)
    require_run_contains(smoke_step, "npm run smoke:static-host", f"{name} static host smoke")
    require(smoke_step.get("working-directory") == "apps/platform-academy", f"{name} smoke must run from apps/platform-academy")
    browser_step = step_by_name(smoke_steps, "Smoke Platform Academy static browser rendering", name)
    require_run_contains(browser_step, "npm run smoke:browser-static-host", f"{name} static browser smoke")
    require(browser_step.get("working-directory") == "apps/platform-academy", f"{name} browser smoke must run from apps/platform-academy")
    browser_smoke_script = (ROOT / "apps/platform-academy/scripts/smoke-browser-static-host.mjs").read_text()
    require("privacy telemetry checks" in browser_smoke_script, f"{name} browser smoke must verify privacy telemetry checks")
    require("globalPrivacyControl" in browser_smoke_script, f"{name} browser smoke must verify Global Privacy Control")
    require("platform-academy" in browser_smoke_script, f"{name} browser smoke must assert the visitor project id")
    summary_step = step_by_name(smoke_steps, "Write smoke summary", name)
    require_run_contains(summary_step, "static API snapshots", f"{name} summary")
    require_run_contains(summary_step, "browser rendering", f"{name} summary")


def verify_platform_static_deploy_workflow() -> None:
    name = "platform-static-deploy.yml"
    data = workflow(name)
    workflow_text = (WORKFLOW_DIR / name).read_text()
    require("PLATFORM_API_BASE" not in workflow_text, f"{name} must not require a live API base")

    permissions = data.get("permissions", {})
    require(permissions.get("contents") == "read", f"{name} must keep contents: read permission")
    require(permissions.get("id-token") == "write", f"{name} must keep id-token: write for AWS OIDC")

    require("workflow_dispatch" in workflow_text, f"{name} must support manual deploys")
    require("push:" not in workflow_text, f"{name} must stay manual until static deploy secrets are configured")

    jobs = data.get("jobs", {})
    require(isinstance(jobs, dict), f"{name} must define jobs")
    deploy_job = jobs.get("deploy-static-site", {})
    require(isinstance(deploy_job, dict), f"{name} must define deploy-static-site job")

    env = data.get("env", {})
    require(isinstance(env, dict), f"{name} must define top-level env")
    for key in [
        "AWS_ROLE_TO_ASSUME",
        "STATIC_SITE_BUCKET",
        "CLOUDFRONT_DISTRIBUTION_ID",
        "CLOUDFRONT_FUNCTION_NAME",
        "SITE_URL",
    ]:
        require(key in env, f"{name} env must include {key}")
    require("PLATFORM_STATIC_WEB_BASE" in str(env.get("SITE_URL", "")), f"{name} should support PLATFORM_STATIC_WEB_BASE")
    require("https://platform-academy.bozhi.dev" in str(env.get("SITE_URL", "")), f"{name} should default to the stable static host")

    deploy_steps = steps(data, "deploy-static-site", name)
    required_step = step_by_name(deploy_steps, "Check required deployment variables", name)
    for key in [
        "AWS_ROLE_TO_ASSUME",
        "STATIC_SITE_BUCKET",
        "CLOUDFRONT_DISTRIBUTION_ID",
        "CLOUDFRONT_FUNCTION_NAME",
        "SITE_URL",
    ]:
        require_run_contains(required_step, f"${{{key}", f"{name} required deployment variables")

    install_step = step_by_name(deploy_steps, "Install Platform Academy dependencies", name)
    require_run_contains(install_step, "npm ci", f"{name} dependency install")
    require_run_contains(install_step, "npx playwright install --with-deps chromium", f"{name} browser install")
    require(install_step.get("working-directory") == "apps/platform-academy", f"{name} install must run from apps/platform-academy")

    router_step = step_by_name(deploy_steps, "Validate static edge router", name)
    require_run_contains(router_step, "npm run validate:static-spa-router", f"{name} router validation")
    test_step = step_by_name(deploy_steps, "Test and build Platform Academy", name)
    require_run_contains(test_step, "npm test -- --run", f"{name} tests")
    require_run_contains(test_step, "npm run build", f"{name} build")

    deploy_text = "\n".join(str(step) for step in deploy_steps)
    for needle in [
        "aws-actions/configure-aws-credentials@v6",
        "mask-aws-account-id",
        "scripts/deploy-static-edge-router.sh",
        "aws s3 sync dist/",
        "aws s3 cp dist/api/",
        "content-type \"application/json; charset=utf-8\"",
        "aws cloudfront create-invalidation",
        "aws cloudfront wait invalidation-completed",
        "GetInvalidation is unavailable",
        "sleep 30",
        "SMOKE_EXPECT_CLEAN_SPA_ROUTING=true WEB_BASE=\"${SITE_URL}\" npm run smoke:static-host",
        "WEB_BASE=\"${SITE_URL}\" npm run smoke:browser-static-host",
    ]:
        require(needle in deploy_text, f"{name} deploy path must include {needle}")


def verify_codeql_workflow() -> None:
    name = "codeql.yml"
    workflow_text = (WORKFLOW_DIR / name).read_text()
    for needle in [
        "permissions:\n  contents: read\n  security-events: write",
        "schedule:",
        "javascript-typescript",
        "python",
        "github/codeql-action/init@v3",
        "build-mode: none",
        "github/codeql-action/analyze@v3",
    ]:
        require(needle in workflow_text, f"{name} must include {needle}")


def main() -> None:
    verify_expected_workflows()
    verify_platform_image_workflow()
    verify_docker_build_workflow()
    verify_backend_frontend_smokes()
    verify_platform_validate_workflow()
    verify_platform_deployed_smoke_workflow()
    verify_platform_static_smoke_workflow()
    verify_platform_static_deploy_workflow()
    verify_codeql_workflow()
    print("Verified GitHub Actions release workflow contracts.")


if __name__ == "__main__":
    main()
