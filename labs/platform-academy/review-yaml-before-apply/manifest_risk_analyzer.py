#!/usr/bin/env python3
"""Evidence-oriented local analyzer for the pre-apply Kubernetes YAML review lab."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

REPO_OR_ARTIFACT_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_OR_ARTIFACT_ROOT / "scripts"))

from yaml_contract import YamlContractError, load_yaml_documents  # noqa: E402


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def load_docs(path: Path) -> list[dict[str, Any]]:
    try:
        return load_yaml_documents(path)
    except YamlContractError as exc:
        fail(f"{path} is not parseable YAML: {exc}")


def metadata(document: dict[str, Any]) -> dict[str, Any]:
    value = document.get("metadata", {})
    return value if isinstance(value, dict) else {}


def document_name(document: dict[str, Any]) -> str:
    return str(metadata(document).get("name", ""))


def document_namespace(document: dict[str, Any]) -> str:
    return str(metadata(document).get("namespace", ""))


def find_kind(docs: list[dict[str, Any]], kind: str, name: str | None = None) -> dict[str, Any] | None:
    for document in docs:
        if document.get("kind") == kind and (name is None or document_name(document) == name):
            return document
    return None


def deployment_containers(deployment: dict[str, Any]) -> list[dict[str, Any]]:
    spec = deployment.get("spec", {})
    template = spec.get("template", {}) if isinstance(spec, dict) else {}
    pod_spec = template.get("spec", {}) if isinstance(template, dict) else {}
    containers = pod_spec.get("containers", []) if isinstance(pod_spec, dict) else []
    return [container for container in containers if isinstance(container, dict)]


def deployment_volumes(deployment: dict[str, Any]) -> list[dict[str, Any]]:
    spec = deployment.get("spec", {})
    template = spec.get("template", {}) if isinstance(spec, dict) else {}
    pod_spec = template.get("spec", {}) if isinstance(template, dict) else {}
    volumes = pod_spec.get("volumes", []) if isinstance(pod_spec, dict) else []
    return [volume for volume in volumes if isinstance(volume, dict)]


def has_clusterrole_secret_access(cluster_role: dict[str, Any]) -> bool:
    rules = cluster_role.get("rules", [])
    if not isinstance(rules, list):
        return False
    for rule in rules:
        if not isinstance(rule, dict):
            continue
        resources = rule.get("resources", [])
        verbs = rule.get("verbs", [])
        if isinstance(resources, list) and isinstance(verbs, list):
            if "secrets" in resources and {"get", "list", "watch"}.issubset(set(verbs)):
                return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vendor", required=True, type=Path)
    parser.add_argument("--safe", required=True, type=Path)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args()

    vendor_docs = load_docs(args.vendor)
    safe_docs = load_docs(args.safe)
    vendor_kinds = [str(document.get("kind", "")) for document in vendor_docs]
    safe_kinds = [str(document.get("kind", "")) for document in safe_docs]

    namespace = find_kind(vendor_docs, "Namespace", "vendor-payments")
    secret = find_kind(vendor_docs, "Secret", "vendor-api-token")
    cluster_role = find_kind(vendor_docs, "ClusterRole", "vendor-platform-reader")
    deployment = find_kind(vendor_docs, "Deployment", "vendor-agent")
    safe_deployment = find_kind(safe_docs, "Deployment", "vendor-agent")

    errors: list[str] = []
    if namespace is None:
        errors.append("vendor.yaml should define Namespace/vendor-payments")
    if secret is None:
        errors.append("vendor.yaml should define Secret/vendor-api-token")
    if cluster_role is None:
        errors.append("vendor.yaml should define ClusterRole/vendor-platform-reader")
    if deployment is None:
        errors.append("vendor.yaml should define Deployment/vendor-agent")
    if set(vendor_kinds) != {"Namespace", "Secret", "ClusterRole", "Deployment"}:
        errors.append(f"vendor.yaml should contain Namespace, Secret, ClusterRole, and Deployment, got {vendor_kinds}")

    if secret is not None:
        string_data = secret.get("stringData", {})
        if not isinstance(string_data, dict) or string_data.get("token") != "replace-me":
            errors.append("vendor Secret should include stringData.token placeholder")
    if cluster_role is not None and not has_clusterrole_secret_access(cluster_role):
        errors.append("vendor ClusterRole should grant get/list/watch access to secrets")
    if deployment is not None:
        if document_namespace(deployment) != "vendor-payments":
            errors.append("vendor Deployment should be scoped to namespace vendor-payments")
        containers = deployment_containers(deployment)
        if not any(container.get("securityContext", {}).get("privileged") is True for container in containers):
            errors.append("vendor Deployment should request privileged runtime")
        if not any(volume.get("hostPath", {}).get("path") == "/" for volume in deployment_volumes(deployment)):
            errors.append("vendor Deployment should mount hostPath /")

    if "ClusterRole" in safe_kinds:
        errors.append("safe-baseline.yaml should remove the ClusterRole")
    if "Secret" in safe_kinds:
        errors.append("safe-baseline.yaml should remove committed Secret material")
    if safe_deployment is None:
        errors.append("safe-baseline.yaml should define Deployment/vendor-agent")
    else:
        containers = deployment_containers(safe_deployment)
        if not containers:
            errors.append("safe Deployment should include the agent container")
        for container in containers:
            security_context = container.get("securityContext", {})
            if not isinstance(security_context, dict):
                errors.append("safe Deployment container should define a securityContext")
                continue
            if security_context.get("allowPrivilegeEscalation") is not False:
                errors.append("safe Deployment should set allowPrivilegeEscalation: false")
            if security_context.get("readOnlyRootFilesystem") is not True:
                errors.append("safe Deployment should set readOnlyRootFilesystem: true")
            if security_context.get("privileged") is True:
                errors.append("safe Deployment should not be privileged")
        if deployment_volumes(safe_deployment):
            errors.append("safe Deployment should not define hostPath or other volumes for this agent")

    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    if not args.quiet:
        print("YAML manifest risk analysis passed.")
        print("- Inventory: vendor.yaml defines Namespace, Secret, ClusterRole, and Deployment.")
        print("- RBAC risk: ClusterRole can get/list/watch secrets across the cluster.")
        print("- Workload risk: Deployment requests privileged runtime and mounts hostPath /.")
        print("- Credential risk: Secret stringData.token is committed as manifest material.")
        print("- Safer baseline: removes ClusterRole, Secret, privileged mode, and hostPath.")
        print("- Decision: block vendor.yaml before apply and request a namespaced hardened manifest.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
