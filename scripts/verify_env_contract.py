#!/usr/bin/env python3
"""Verify sample environment config covers app runtime knobs."""

from __future__ import annotations

import ast
import re
from pathlib import Path
from typing import Any

from yaml_contract import YamlContractError, load_single_yaml_document

REPO_ROOT = Path(__file__).resolve().parents[1]
ENV_EXAMPLE = REPO_ROOT / ".env.example"
API_CONFIG = REPO_ROOT / "apps" / "api" / "app" / "config.py"
WORKER = REPO_ROOT / "apps" / "worker" / "worker.py"
COMPOSE = REPO_ROOT / "docker-compose.yml"
REQUIRED_ADDITIONAL_ENV = {"PLATFORM_API_UPSTREAM", "VITE_API_BASE_URL", "WORKER_INTERVAL_SECONDS"}
REQUIRED_CORS_ORIGINS = {
    "http://localhost:5174",
    "http://localhost:8090",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:8090",
}
REQUIRED_RATE_LIMIT_EXEMPT_PATHS = {"/healthz", "/readyz", "/metrics"}
REQUIRED_COMPOSE_API_ENV = {
    "ENVIRONMENT",
    "DATABASE_URL",
    "REDIS_URL",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "CORS_ORIGINS",
    "AUTO_SEED",
    "CREATE_SCHEMA_ON_STARTUP",
    "RATE_LIMIT_PER_MINUTE",
    "RATE_LIMIT_EXEMPT_PATHS",
    "TRUSTED_PROXY_CIDRS",
    "PLATFORM_SOURCE_BUNDLE_PUBLIC",
    "PLATFORM_SOURCE_BUNDLE_TOKEN",
}
REQUIRED_COMPOSE_WORKER_ENV = {
    "ENVIRONMENT",
    "DATABASE_URL",
    "REDIS_URL",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "WORKER_INTERVAL_SECONDS",
}


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def parse_env_example() -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in ENV_EXAMPLE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip("'\"")
    return values


def api_settings_env_names() -> set[str]:
    tree = ast.parse(API_CONFIG.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.ClassDef) and node.name == "Settings":
            return {
                statement.target.id.upper()
                for statement in node.body
                if isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name)
            }
    fail("could not find Settings class in API config")


def worker_env_names() -> set[str]:
    return set(re.findall(r"os\.getenv\([\"']([A-Z0-9_]+)[\"']", WORKER.read_text(encoding="utf-8")))


def comma_set(value: str) -> set[str]:
    return {item.strip() for item in value.split(",") if item.strip()}


def require_equal(actual: Any, expected: Any, label: str) -> None:
    if actual != expected:
        fail(f"{label} expected {expected!r}, got {actual!r}")


def require_keys(mapping: dict[str, Any], keys: set[str], label: str) -> None:
    missing = sorted(keys - set(mapping))
    if missing:
        fail(f"{label} missing keys: {missing}")


def compose_document() -> dict[str, Any]:
    try:
        document = load_single_yaml_document(COMPOSE)
    except YamlContractError as exc:
        fail(f"could not parse docker-compose.yml: {exc}")
    return document


def compose_service(compose: dict[str, Any], name: str) -> dict[str, Any]:
    services = compose.get("services", {})
    if not isinstance(services, dict):
        fail("docker-compose.yml services should be a mapping")
    service = services.get(name)
    if not isinstance(service, dict):
        fail(f"docker-compose.yml missing service {name}")
    return service


def compose_environment(service: dict[str, Any], name: str) -> dict[str, Any]:
    environment = service.get("environment", {})
    if not isinstance(environment, dict):
        fail(f"docker-compose.yml service {name} environment should be a mapping")
    return environment


def compose_build(service: dict[str, Any], name: str) -> dict[str, Any]:
    build = service.get("build", {})
    if not isinstance(build, dict):
        fail(f"docker-compose.yml service {name} build should be a mapping")
    return build


def compose_depends_on(service: dict[str, Any]) -> set[str]:
    depends_on = service.get("depends_on", {})
    if isinstance(depends_on, dict):
        return set(depends_on)
    if isinstance(depends_on, list):
        return {str(item) for item in depends_on}
    return set()


def require_ports(service: dict[str, Any], expected: set[str], name: str) -> None:
    ports = service.get("ports", [])
    if not isinstance(ports, list):
        fail(f"docker-compose.yml service {name} ports should be a list")
    missing = sorted(expected - {str(port) for port in ports})
    if missing:
        fail(f"docker-compose.yml service {name} missing ports: {missing}")


def require_depends_on(service: dict[str, Any], expected: set[str], name: str) -> None:
    missing = sorted(expected - compose_depends_on(service))
    if missing:
        fail(f"docker-compose.yml service {name} missing depends_on services: {missing}")


def verify_compose_contract(env_example: dict[str, str]) -> None:
    compose = compose_document()
    services = compose.get("services", {})
    if not isinstance(services, dict):
        fail("docker-compose.yml services should be a mapping")
    require_keys(
        services,
        {
            "api",
            "worker",
            "frontend",
            "platform-academy",
            "postgres",
            "redis",
            "prometheus",
            "grafana",
            "jaeger",
        },
        "docker-compose.yml services",
    )

    api = compose_service(compose, "api")
    api_build = compose_build(api, "api")
    require_equal(api_build.get("dockerfile"), "apps/api/Dockerfile", "docker-compose.yml api Dockerfile")
    api_env = compose_environment(api, "api")
    require_keys(api_env, REQUIRED_COMPOSE_API_ENV, "docker-compose.yml api environment")
    for key in ["DATABASE_URL", "REDIS_URL", "OTEL_EXPORTER_OTLP_ENDPOINT", "CORS_ORIGINS", "RATE_LIMIT_EXEMPT_PATHS"]:
        require_equal(api_env.get(key), env_example[key], f"docker-compose.yml api {key}")
    require_equal(api_env.get("ENVIRONMENT"), "local", "docker-compose.yml api ENVIRONMENT")
    require_equal(api_env.get("AUTO_SEED"), "true", "docker-compose.yml api AUTO_SEED")
    require_equal(api_env.get("CREATE_SCHEMA_ON_STARTUP"), "true", "docker-compose.yml api CREATE_SCHEMA_ON_STARTUP")
    require_equal(api_env.get("RATE_LIMIT_PER_MINUTE"), "120", "docker-compose.yml api RATE_LIMIT_PER_MINUTE")
    require_equal(api_env.get("TRUSTED_PROXY_CIDRS"), "", "docker-compose.yml api TRUSTED_PROXY_CIDRS")
    require_equal(api_env.get("PLATFORM_SOURCE_BUNDLE_PUBLIC"), "true", "docker-compose.yml api PLATFORM_SOURCE_BUNDLE_PUBLIC")
    require_equal(api_env.get("PLATFORM_SOURCE_BUNDLE_TOKEN"), "", "docker-compose.yml api PLATFORM_SOURCE_BUNDLE_TOKEN")
    require_ports(api, {"8000:8000"}, "api")
    require_depends_on(api, {"postgres", "redis", "jaeger"}, "api")
    require_equal(
        api.get("healthcheck", {}).get("test"),
        ["CMD", "curl", "-f", "http://localhost:8000/healthz"],
        "docker-compose.yml api healthcheck",
    )

    worker = compose_service(compose, "worker")
    worker_build = compose_build(worker, "worker")
    require_equal(worker_build.get("dockerfile"), "apps/worker/Dockerfile", "docker-compose.yml worker Dockerfile")
    worker_env = compose_environment(worker, "worker")
    require_keys(worker_env, REQUIRED_COMPOSE_WORKER_ENV, "docker-compose.yml worker environment")
    for key in ["ENVIRONMENT", "DATABASE_URL", "REDIS_URL", "OTEL_EXPORTER_OTLP_ENDPOINT"]:
        require_equal(worker_env.get(key), env_example[key], f"docker-compose.yml worker {key}")
    require_equal(worker_env.get("WORKER_INTERVAL_SECONDS"), "30", "docker-compose.yml worker WORKER_INTERVAL_SECONDS")
    require_ports(worker, {"9100:9100"}, "worker")
    require_depends_on(worker, {"api", "redis"}, "worker")

    frontend = compose_service(compose, "frontend")
    require_equal(
        compose_build(frontend, "frontend").get("dockerfile"),
        "apps/frontend/Dockerfile",
        "docker-compose.yml frontend Dockerfile",
    )
    require_ports(frontend, {"8080:80"}, "frontend")
    require_depends_on(frontend, {"api"}, "frontend")

    platform = compose_service(compose, "platform-academy")
    require_equal(
        compose_build(platform, "platform-academy").get("dockerfile"),
        "apps/platform-academy/Dockerfile",
        "docker-compose.yml platform-academy Dockerfile",
    )
    require_ports(platform, {"8090:80"}, "platform-academy")
    require_depends_on(platform, {"api"}, "platform-academy")


def main() -> int:
    env = parse_env_example()
    expected = api_settings_env_names() | worker_env_names() | REQUIRED_ADDITIONAL_ENV
    missing = sorted(expected - set(env))
    if missing:
        fail(f".env.example missing keys: {missing}")

    cors_origins = comma_set(env["CORS_ORIGINS"])
    missing_origins = sorted(REQUIRED_CORS_ORIGINS - cors_origins)
    if missing_origins:
        fail(f".env.example CORS_ORIGINS missing Platform Academy local origins: {missing_origins}")

    exempt_paths = comma_set(env["RATE_LIMIT_EXEMPT_PATHS"])
    missing_exempt_paths = sorted(REQUIRED_RATE_LIMIT_EXEMPT_PATHS - exempt_paths)
    if missing_exempt_paths:
        fail(f".env.example RATE_LIMIT_EXEMPT_PATHS missing probe paths: {missing_exempt_paths}")

    if env["PLATFORM_SOURCE_BUNDLE_PUBLIC"] != "false":
        fail(".env.example must keep PLATFORM_SOURCE_BUNDLE_PUBLIC=false; only local/test/development can opt into public source bundles")

    verify_compose_contract(env)

    print(f"Verified environment contract for {len(expected)} runtime keys.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
