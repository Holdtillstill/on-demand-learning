#!/usr/bin/env python3
"""Verify product-specific expectations in the Kubernetes scaffold."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from yaml_contract import YamlContractError, load_yaml_documents

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST = REPO_ROOT / "infra" / "k8s" / "zhongwen-platform.yaml"


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def load_manifest_documents() -> list[dict[str, Any]]:
    try:
        return load_yaml_documents(MANIFEST)
    except YamlContractError as exc:
        fail(f"could not parse Kubernetes manifest: {exc}")


def metadata_name(document: dict[str, Any]) -> str:
    metadata = document.get("metadata")
    if not isinstance(metadata, dict):
        return ""
    return str(metadata.get("name", ""))


def find_document(docs: list[dict[str, Any]], kind: str, name: str) -> dict[str, Any]:
    for document in docs:
        if document.get("kind") == kind and metadata_name(document) == name:
            return document
    fail(f"missing {kind}/{name}")


def require_equal(actual: Any, expected: Any, label: str) -> None:
    if actual != expected:
        fail(f"{label} expected {expected!r}, got {actual!r}")


def require_truthy(value: Any, label: str) -> None:
    if not value:
        fail(f"{label} is missing")


def require_keys(mapping: dict[str, Any], keys: set[str], label: str) -> None:
    missing = sorted(keys - set(mapping))
    if missing:
        fail(f"{label} missing keys: {missing}")


def containers(deployment_or_job: dict[str, Any]) -> list[dict[str, Any]]:
    spec = deployment_or_job.get("spec", {})
    template = spec.get("template", {}) if isinstance(spec, dict) else {}
    pod_spec = template.get("spec", {}) if isinstance(template, dict) else {}
    container_list = pod_spec.get("containers", []) if isinstance(pod_spec, dict) else []
    if not isinstance(container_list, list):
        fail(f"{deployment_or_job.get('kind')}/{metadata_name(deployment_or_job)} containers should be a list")
    return container_list


def container_by_name(deployment_or_job: dict[str, Any], name: str) -> dict[str, Any]:
    for container in containers(deployment_or_job):
        if isinstance(container, dict) and container.get("name") == name:
            return container
    fail(f"{deployment_or_job.get('kind')}/{metadata_name(deployment_or_job)} missing container {name}")


def env_from_names(container: dict[str, Any]) -> tuple[set[str], set[str]]:
    config_maps: set[str] = set()
    secrets: set[str] = set()
    for source in container.get("envFrom", []):
        if not isinstance(source, dict):
            continue
        config_ref = source.get("configMapRef")
        secret_ref = source.get("secretRef")
        if isinstance(config_ref, dict) and config_ref.get("name"):
            config_maps.add(str(config_ref["name"]))
        if isinstance(secret_ref, dict) and secret_ref.get("name"):
            secrets.add(str(secret_ref["name"]))
    return config_maps, secrets


def env_value(container: dict[str, Any], name: str) -> Any:
    for item in container.get("env", []):
        if isinstance(item, dict) and item.get("name") == name:
            return item.get("value")
    fail(f"container {container.get('name')} missing env {name}")


def probe_path(container: dict[str, Any], probe_name: str) -> str:
    probe = container.get(probe_name, {})
    http_get = probe.get("httpGet", {}) if isinstance(probe, dict) else {}
    path = http_get.get("path")
    if not path:
        fail(f"container {container.get('name')} missing {probe_name}.httpGet.path")
    return str(path)


def service_port(service: dict[str, Any], name: str) -> dict[str, Any]:
    ports = service.get("spec", {}).get("ports", [])
    for port in ports:
        if isinstance(port, dict) and port.get("name") == name:
            return port
    fail(f"Service/{metadata_name(service)} missing port {name}")


def ingress_rule(ingress: dict[str, Any], host: str) -> dict[str, Any]:
    for rule in ingress.get("spec", {}).get("rules", []):
        if isinstance(rule, dict) and rule.get("host") == host:
            return rule
    fail(f"Ingress/{metadata_name(ingress)} missing host {host}")


def ingress_backend(rule: dict[str, Any], path: str) -> tuple[str, int]:
    paths = rule.get("http", {}).get("paths", [])
    for item in paths:
        if not isinstance(item, dict) or item.get("path") != path:
            continue
        service = item.get("backend", {}).get("service", {})
        port = service.get("port", {})
        return str(service.get("name")), int(port.get("number"))
    fail(f"Ingress rule for {rule.get('host')} missing path {path}")


def verify_config_map(config: dict[str, Any]) -> None:
    data = config.get("data", {})
    if not isinstance(data, dict):
        fail("ConfigMap/zhongwen-config data should be a mapping")
    require_keys(
        data,
        {
            "ENVIRONMENT",
            "CORS_ORIGINS",
            "AUTO_SEED",
            "CREATE_SCHEMA_ON_STARTUP",
            "RATE_LIMIT_PER_MINUTE",
            "RATE_LIMIT_EXEMPT_PATHS",
            "TRUSTED_PROXY_CIDRS",
            "PLATFORM_SOURCE_BUNDLE_PUBLIC",
            "REDIS_URL",
            "OTEL_EXPORTER_OTLP_ENDPOINT",
        },
        "ConfigMap/zhongwen-config data",
    )
    require_equal(data["ENVIRONMENT"], "demo", "ConfigMap ENVIRONMENT")
    origins = {origin.strip() for origin in str(data["CORS_ORIGINS"]).split(",") if origin.strip()}
    require_equal({"https://learn.example.com", "https://academy.example.com"} <= origins, True, "ConfigMap CORS_ORIGINS hosts")
    require_equal(data["AUTO_SEED"], "false", "ConfigMap AUTO_SEED")
    require_equal(data["CREATE_SCHEMA_ON_STARTUP"], "false", "ConfigMap CREATE_SCHEMA_ON_STARTUP")
    require_equal(str(data["RATE_LIMIT_PER_MINUTE"]), "120", "ConfigMap RATE_LIMIT_PER_MINUTE")
    require_equal(data["RATE_LIMIT_EXEMPT_PATHS"], "/healthz,/readyz,/metrics", "ConfigMap RATE_LIMIT_EXEMPT_PATHS")
    require_equal(data["PLATFORM_SOURCE_BUNDLE_PUBLIC"], "false", "ConfigMap PLATFORM_SOURCE_BUNDLE_PUBLIC")
    require_equal(data["REDIS_URL"], "redis://redis:6379/0", "ConfigMap REDIS_URL")


def verify_secret(secret: dict[str, Any]) -> None:
    string_data = secret.get("stringData", {})
    if not isinstance(string_data, dict):
        fail("Secret/zhongwen-secrets-template stringData should be a mapping")
    require_keys(string_data, {"DATABASE_URL", "PLATFORM_SOURCE_BUNDLE_TOKEN"}, "Secret/zhongwen-secrets-template stringData")
    require_truthy(string_data["PLATFORM_SOURCE_BUNDLE_TOKEN"], "Secret PLATFORM_SOURCE_BUNDLE_TOKEN")


def verify_workload_env(workload: dict[str, Any], container_name: str) -> dict[str, Any]:
    container = container_by_name(workload, container_name)
    config_maps, secrets = env_from_names(container)
    require_equal("zhongwen-config" in config_maps, True, f"{workload.get('kind')}/{metadata_name(workload)} envFrom config")
    require_equal("zhongwen-secrets-template" in secrets, True, f"{workload.get('kind')}/{metadata_name(workload)} envFrom secret")
    return container


def verify_deployments(docs: list[dict[str, Any]]) -> None:
    backend = find_document(docs, "Deployment", "backend")
    backend_container = verify_workload_env(backend, "backend")
    require_equal(backend_container.get("image"), "ghcr.io/example/zhongwen-api:replace-me", "backend image")
    require_equal(probe_path(backend_container, "readinessProbe"), "/readyz", "backend readiness probe")
    require_equal(probe_path(backend_container, "livenessProbe"), "/healthz", "backend liveness probe")

    worker = find_document(docs, "Deployment", "worker")
    worker_container = verify_workload_env(worker, "worker")
    require_equal(worker_container.get("image"), "ghcr.io/example/zhongwen-worker:replace-me", "worker image")

    platform = find_document(docs, "Deployment", "platform-academy")
    platform_container = container_by_name(platform, "platform-academy")
    require_equal(platform_container.get("image"), "ghcr.io/example/platform-academy-web:replace-me", "platform-academy image")
    require_equal(env_value(platform_container, "PLATFORM_API_UPSTREAM"), "http://backend:8000", "platform-academy PLATFORM_API_UPSTREAM")
    require_equal(probe_path(platform_container, "readinessProbe"), "/dashboard/home", "platform-academy readiness probe")
    require_equal(probe_path(platform_container, "livenessProbe"), "/dashboard/home", "platform-academy liveness probe")


def verify_migration_job(docs: list[dict[str, Any]]) -> None:
    job = find_document(docs, "Job", "backend-migrations")
    service_account = job.get("spec", {}).get("template", {}).get("spec", {}).get("serviceAccountName")
    require_equal(service_account, "zhongwen-api", "migration job service account")
    container = verify_workload_env(job, "alembic")
    require_equal(container.get("image"), "ghcr.io/example/zhongwen-api:replace-me", "migration job image")
    require_equal(container.get("command"), ["alembic", "upgrade", "head"], "migration job command")


def verify_services(docs: list[dict[str, Any]]) -> None:
    expected = {
        "backend": ("http", 8000, 8000),
        "platform-academy": ("http", 80, 80),
        "frontend": ("http", 80, 80),
        "redis": ("redis", 6379, 6379),
    }
    for name, (port_name, port, target_port) in expected.items():
        service = find_document(docs, "Service", name)
        service_spec = service.get("spec", {})
        require_equal(service_spec.get("selector", {}).get("app"), name, f"Service/{name} selector")
        port_spec = service_port(service, port_name)
        require_equal(port_spec.get("port"), port, f"Service/{name} port")
        require_equal(port_spec.get("targetPort"), target_port, f"Service/{name} targetPort")


def verify_scaling_and_disruption(docs: list[dict[str, Any]]) -> None:
    for name in ["platform-academy", "backend", "frontend"]:
        hpa = find_document(docs, "HorizontalPodAutoscaler", name)
        require_equal(hpa.get("spec", {}).get("scaleTargetRef", {}).get("name"), name, f"HPA/{name} target")
        require_equal(hpa.get("spec", {}).get("minReplicas"), 2, f"HPA/{name} minReplicas")
        require_truthy(hpa.get("spec", {}).get("maxReplicas"), f"HPA/{name} maxReplicas")

        pdb = find_document(docs, "PodDisruptionBudget", name)
        require_equal(pdb.get("spec", {}).get("minAvailable"), 1, f"PDB/{name} minAvailable")
        require_equal(pdb.get("spec", {}).get("selector", {}).get("matchLabels", {}).get("app"), name, f"PDB/{name} selector")


def verify_ingress(docs: list[dict[str, Any]]) -> None:
    ingress = find_document(docs, "Ingress", "zhongwen")
    require_equal(ingress.get("spec", {}).get("ingressClassName"), "nginx", "Ingress ingressClassName")
    learn = ingress_rule(ingress, "learn.example.com")
    academy = ingress_rule(ingress, "academy.example.com")
    for rule in [learn, academy]:
        for path in ["/healthz", "/readyz", "/metrics", "/api"]:
            require_equal(ingress_backend(rule, path), ("backend", 8000), f"Ingress {rule.get('host')} {path}")
    require_equal(ingress_backend(learn, "/"), ("frontend", 80), "Ingress learn root")
    require_equal(ingress_backend(academy, "/"), ("platform-academy", 80), "Ingress academy root")


def main() -> int:
    docs = load_manifest_documents()
    require_equal(len(docs), 24, "Kubernetes document count")
    find_document(docs, "Namespace", "zhongwen")
    find_document(docs, "ServiceAccount", "zhongwen-api")
    find_document(docs, "ServiceAccount", "zhongwen-worker")
    verify_config_map(find_document(docs, "ConfigMap", "zhongwen-config"))
    verify_secret(find_document(docs, "Secret", "zhongwen-secrets-template"))
    verify_migration_job(docs)
    verify_deployments(docs)
    verify_services(docs)
    verify_scaling_and_disruption(docs)
    find_document(docs, "NetworkPolicy", "default-deny-except-platform")
    verify_ingress(docs)

    print("Verified Kubernetes Platform Academy deployment contract.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
