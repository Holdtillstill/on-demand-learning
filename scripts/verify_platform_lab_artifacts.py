#!/usr/bin/env python3
"""Verify high-value Platform Academy lab artifacts structurally."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
LAB_ROOT = REPO_ROOT / "labs" / "platform-academy"
API_ROOT = REPO_ROOT / "apps" / "api"
sys.path.insert(0, str(REPO_ROOT / "scripts"))
sys.path.insert(0, str(API_ROOT))

from app.platform_content import PORTFOLIO_LAB_SLUGS  # noqa: E402
from yaml_contract import YamlContractError, load_single_yaml_document, load_yaml_documents  # noqa: E402

PORTFOLIO_LABS = [
    "trace-service-to-pod",
    "debug-crashloop-imagepull",
    "trace-network-path",
    "debug-irsa-access-denied",
    "trace-argocd-drift",
    "design-safe-release-pipeline",
    "write-slo-backed-runbook",
]


class ArtifactFailure(Exception):
    pass


def fail(message: str) -> None:
    raise ArtifactFailure(message)


def require(condition: bool, message: str) -> None:
    if not condition:
        fail(message)


def lab_path(slug: str, filename: str) -> Path:
    return LAB_ROOT / slug / filename


def yaml_docs(slug: str, filename: str) -> list[dict[str, Any]]:
    path = lab_path(slug, filename)
    try:
        return load_yaml_documents(path)
    except YamlContractError as exc:
        fail(f"{slug}/{filename} is not parseable YAML: {exc}")


def yaml_doc(slug: str, filename: str) -> dict[str, Any]:
    path = lab_path(slug, filename)
    try:
        return load_single_yaml_document(path)
    except YamlContractError as exc:
        fail(f"{slug}/{filename} is not parseable YAML: {exc}")


def json_doc(slug: str, filename: str) -> dict[str, Any]:
    path = lab_path(slug, filename)
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        fail(f"{slug}/{filename} is not parseable JSON: {exc}")
    require(isinstance(data, dict), f"{slug}/{filename} should contain a JSON object")
    return data


def mapping(value: Any, label: str) -> dict[str, Any]:
    require(isinstance(value, dict), f"{label} should be a mapping")
    return value


def sequence(value: Any, label: str) -> list[Any]:
    require(isinstance(value, list), f"{label} should be a list")
    return value


def get_map(value: dict[str, Any], key: str, label: str) -> dict[str, Any]:
    return mapping(value.get(key), f"{label}.{key}")


def get_list(value: dict[str, Any], key: str, label: str) -> list[Any]:
    return sequence(value.get(key), f"{label}.{key}")


def get_str(value: dict[str, Any], key: str, label: str) -> str:
    item = value.get(key)
    require(isinstance(item, str), f"{label}.{key} should be a string")
    return item


def metadata(doc: dict[str, Any], label: str) -> dict[str, Any]:
    return get_map(doc, "metadata", label)


def spec(doc: dict[str, Any], label: str) -> dict[str, Any]:
    return get_map(doc, "spec", label)


def find_doc(docs: list[dict[str, Any]], kind: str, name: str, namespace: str | None = None) -> dict[str, Any]:
    for doc in docs:
        meta = metadata(doc, f"{kind}/{name}")
        if doc.get("kind") != kind or meta.get("name") != name:
            continue
        if namespace is not None and meta.get("namespace") != namespace:
            continue
        return doc
    scope = f"{namespace}/" if namespace else ""
    fail(f"missing {kind} {scope}{name}")


def deployment_selector(deployment: dict[str, Any], label: str) -> dict[str, Any]:
    return get_map(get_map(spec(deployment, label), "selector", label), "matchLabels", f"{label}.spec.selector")


def deployment_pod_labels(deployment: dict[str, Any], label: str) -> dict[str, Any]:
    template = get_map(spec(deployment, label), "template", label)
    return metadata(template, f"{label}.spec.template").get("labels", {})


def deployment_container(deployment: dict[str, Any], name: str, label: str) -> dict[str, Any]:
    template = get_map(spec(deployment, label), "template", label)
    pod_spec = get_map(template, "spec", f"{label}.spec.template")
    for container in get_list(pod_spec, "containers", f"{label}.spec.template.spec"):
        container_map = mapping(container, f"{label} container")
        if container_map.get("name") == name:
            return container_map
    fail(f"{label} missing container {name}")


def pod_container(pod: dict[str, Any], name: str, label: str) -> dict[str, Any]:
    for container in get_list(spec(pod, label), "containers", f"{label}.spec"):
        container_map = mapping(container, f"{label} container")
        if container_map.get("name") == name:
            return container_map
    fail(f"{label} missing container {name}")


def service_port(service: dict[str, Any], name: str, label: str) -> dict[str, Any]:
    for port in get_list(spec(service, label), "ports", f"{label}.spec"):
        port_map = mapping(port, f"{label} port")
        if port_map.get("name") == name:
            return port_map
    fail(f"{label} missing service port {name}")


def container_port_names(container: dict[str, Any], label: str) -> set[str]:
    ports = container.get("ports", [])
    require(isinstance(ports, list), f"{label}.ports should be a list")
    return {str(mapping(port, f"{label} port").get("name")) for port in ports if mapping(port, f"{label} port").get("name")}


def step_runs(steps: list[Any]) -> list[str]:
    runs: list[str] = []
    for step in steps:
        step_map = mapping(step, "workflow step")
        run = step_map.get("run")
        if isinstance(run, str):
            runs.append(run)
    return runs


def all_step_text(steps: list[Any]) -> str:
    return "\n".join(step_runs(steps))


def assume_role_subject(policy: dict[str, Any]) -> str:
    statements = sequence(policy.get("Statement"), "trust policy Statement")
    require(len(statements) == 1, "trust policy should contain exactly one statement")
    statement = mapping(statements[0], "trust policy statement")
    conditions = get_map(statement, "Condition", "trust policy statement")
    string_equals = get_map(conditions, "StringEquals", "trust policy statement.Condition")
    subject_keys = [key for key in string_equals if key.endswith(":sub")]
    require(len(subject_keys) == 1, "trust policy should contain exactly one subject condition")
    subject = string_equals[subject_keys[0]]
    require(isinstance(subject, str), "trust policy subject should be a string")
    require(string_equals.get(subject_keys[0].replace(":sub", ":aud")) == "sts.amazonaws.com", "trust policy should require sts audience")
    return subject


def verify_trace_service_to_pod() -> None:
    slug = "trace-service-to-pod"
    start = yaml_docs(slug, "start.yaml")
    fixed = yaml_docs(slug, "fixed.yaml")
    start_deploy = find_doc(start, "Deployment", "checkout", "payments")
    fixed_deploy = find_doc(fixed, "Deployment", "checkout", "payments")
    start_service = find_doc(start, "Service", "checkout", "payments")
    fixed_service = find_doc(fixed, "Service", "checkout", "payments")
    find_doc(start, "Namespace", "payments")
    find_doc(fixed, "Namespace", "payments")

    start_selector = deployment_selector(start_deploy, "start Deployment")
    start_labels = deployment_pod_labels(start_deploy, "start Deployment")
    fixed_selector = deployment_selector(fixed_deploy, "fixed Deployment")
    fixed_labels = deployment_pod_labels(fixed_deploy, "fixed Deployment")
    require(start_selector == {"app": "checkout-api"}, "start Deployment selector should target checkout-api")
    require(start_selector.items() <= start_labels.items(), "start Deployment selector should match its Pod template")
    require(fixed_selector == start_selector and fixed_labels == start_labels, "fixed manifest should not change the healthy Deployment")
    require(
        get_map(spec(start_service, "start Service"), "selector", "start Service.spec") == {"app": "checkout"},
        "start Service should be broken",
    )
    require(
        get_map(spec(fixed_service, "fixed Service"), "selector", "fixed Service.spec") == {"app": "checkout-api"},
        "fixed Service should target checkout-api Pods",
    )
    require(
        service_port(start_service, "http", "start Service").get("targetPort") == "http", "start Service should preserve named targetPort"
    )
    require(
        service_port(fixed_service, "http", "fixed Service").get("targetPort") == "http", "fixed Service should preserve named targetPort"
    )
    require(
        "http" in container_port_names(deployment_container(start_deploy, "checkout", "start Deployment"), "start container"),
        "Pod port should be named http",
    )


def verify_debug_crashloop_imagepull() -> None:
    slug = "debug-crashloop-imagepull"
    start = yaml_docs(slug, "start.yaml")
    fixed = yaml_docs(slug, "fixed.yaml")
    find_doc(start, "Namespace", "payments-debug")
    find_doc(fixed, "Namespace", "payments-debug")
    start_crash = find_doc(start, "Deployment", "checkout-crash", "payments-debug")
    start_pull = find_doc(start, "Deployment", "checkout-pull", "payments-debug")
    fixed_crash = find_doc(fixed, "Deployment", "checkout-crash", "payments-debug")
    fixed_pull = find_doc(fixed, "Deployment", "checkout-pull", "payments-debug")

    for deployment, name in [
        (start_crash, "checkout-crash"),
        (start_pull, "checkout-pull"),
        (fixed_crash, "checkout-crash"),
        (fixed_pull, "checkout-pull"),
    ]:
        selector = deployment_selector(deployment, name)
        labels = deployment_pod_labels(deployment, name)
        require(selector == {"app": name}, f"{name} selector should match its app label")
        require(selector.items() <= labels.items(), f"{name} selector should match its Pod labels")

    start_crash_container = deployment_container(start_crash, "checkout", "start checkout-crash")
    start_crash_command = " ".join(str(item) for item in sequence(start_crash_container.get("command"), "checkout-crash command"))
    require(start_crash_container.get("image") == "busybox:1.36", "start checkout-crash should use busybox")
    require(
        "missing DB_URL" in start_crash_command and "exit 42" in start_crash_command,
        "start checkout-crash should fail after emitting the app config signal",
    )
    require(
        deployment_container(start_pull, "checkout", "start checkout-pull").get("image") == "registry.invalid.example/checkout:missing",
        "start checkout-pull should use an invalid registry reference",
    )
    fixed_crash_command = " ".join(
        str(item)
        for item in sequence(deployment_container(fixed_crash, "checkout", "fixed checkout-crash").get("command"), "fixed command")
    )
    require("checkout healthy" in fixed_crash_command and "exit 42" not in fixed_crash_command, "fixed checkout-crash should stay running")
    require(
        deployment_container(fixed_pull, "checkout", "fixed checkout-pull").get("image") == "nginx:1.25-alpine",
        "fixed checkout-pull should use a pullable image",
    )


def verify_trace_network_path() -> None:
    slug = "trace-network-path"
    broken = yaml_docs(slug, "ingress-service.yaml")
    fixed = yaml_docs(slug, "fixed-ingress-service.yaml")
    broken_ingress = find_doc(broken, "Ingress", "checkout", "payments")
    broken_service = find_doc(broken, "Service", "checkout", "payments")
    broken_pod = find_doc(broken, "Pod", "checkout-example", "payments")
    fixed_service = find_doc(fixed, "Service", "checkout", "payments")
    fixed_pod = find_doc(fixed, "Pod", "checkout-example", "payments")

    rules = get_list(spec(broken_ingress, "broken Ingress"), "rules", "broken Ingress.spec")
    require(mapping(rules[0], "Ingress rule").get("host") == "checkout.example.com", "Ingress should route checkout.example.com")
    paths = get_list(get_map(mapping(rules[0], "Ingress rule"), "http", "Ingress rule"), "paths", "Ingress rule.http")
    backend = get_map(get_map(mapping(paths[0], "Ingress path"), "backend", "Ingress path"), "service", "Ingress path.backend")
    require(backend.get("name") == "checkout", "Ingress backend should target checkout Service")
    require(get_map(backend, "port", "Ingress backend service").get("name") == "http", "Ingress backend should target Service port http")

    broken_target = service_port(broken_service, "http", "broken Service").get("targetPort")
    fixed_target = service_port(fixed_service, "http", "fixed Service").get("targetPort")
    broken_ports = container_port_names(pod_container(broken_pod, "checkout", "broken Pod"), "broken Pod checkout")
    fixed_ports = container_port_names(pod_container(fixed_pod, "checkout", "fixed Pod"), "fixed Pod checkout")
    require(
        get_map(spec(broken_service, "broken Service"), "selector", "broken Service.spec") == {"app": "checkout"},
        "Service selector should target checkout Pods",
    )
    require(broken_target == "web" and "web" not in broken_ports, "broken Service should point at a missing Pod port name")
    require(fixed_target == "http" and "http" in fixed_ports, "fixed Service should point at the Pod port name")


def verify_debug_irsa_access_denied() -> None:
    slug = "debug-irsa-access-denied"
    docs = yaml_docs(slug, "serviceaccount.yaml")
    service_account = find_doc(docs, "ServiceAccount", "checkout", "payments")
    pod = find_doc(docs, "Pod", "checkout-example", "payments")
    annotations = get_map(metadata(service_account, "ServiceAccount"), "annotations", "ServiceAccount.metadata")
    require(
        annotations.get("eks.amazonaws.com/role-arn") == "arn:aws:iam::111122223333:role/payments-checkout-readonly",
        "ServiceAccount should carry the expected IRSA role annotation",
    )
    require(spec(pod, "Pod").get("serviceAccountName") == "checkout", "Pod should run as the checkout ServiceAccount")

    broken_subject = assume_role_subject(json_doc(slug, "trust-policy.json"))
    fixed_subject = assume_role_subject(json_doc(slug, "fixed-trust-policy.json"))
    require(broken_subject == "system:serviceaccount:default:checkout", "broken trust policy should use the wrong namespace subject")
    require(fixed_subject == "system:serviceaccount:payments:checkout", "fixed trust policy should use the workload namespace subject")

    policy = json_doc(slug, "least-privilege-policy.json")
    statement = mapping(sequence(policy.get("Statement"), "least-privilege policy Statement")[0], "least-privilege statement")
    require(statement.get("Action") == "s3:PutObject", "least-privilege policy should allow only PutObject")
    require(
        statement.get("Resource") == "arn:aws:s3:::payments-prod-receipts/receipts/*",
        "least-privilege policy should scope the receipts prefix",
    )

    event = json_doc(slug, "cloudtrail-event.json")
    require(
        event.get("eventSource") == "s3.amazonaws.com" and event.get("eventName") == "PutObject",
        "CloudTrail event should be an S3 PutObject",
    )
    require(event.get("errorCode") == "AccessDenied", "CloudTrail event should show AccessDenied")
    request = get_map(event, "requestParameters", "CloudTrail event")
    require(request.get("bucketName") == "payments-prod-receipts", "CloudTrail request should name the receipts bucket")
    require(str(request.get("key", "")).startswith("receipts/"), "CloudTrail request should use the receipts prefix")


def verify_trace_argocd_drift() -> None:
    slug = "trace-argocd-drift"
    desired = yaml_doc(slug, "desired.yaml")
    live = yaml_doc(slug, "live.yaml")
    ignore = yaml_doc(slug, "ignore-differences.yaml")
    require(desired.get("kind") == "Deployment" and live.get("kind") == "Deployment", "desired/live manifests should be Deployments")
    require(
        metadata(desired, "desired").get("name") == metadata(live, "live").get("name") == "checkout",
        "desired/live should describe checkout",
    )
    require(
        metadata(desired, "desired").get("namespace") == metadata(live, "live").get("namespace") == "payments",
        "desired/live should stay in payments",
    )
    require(spec(desired, "desired").get("replicas") == 3, "desired Deployment should declare 3 replicas")
    require(spec(live, "live").get("replicas") == 9, "live Deployment should show 9 replicas")
    desired_container = deployment_container(desired, "checkout", "desired Deployment")
    live_container = deployment_container(live, "checkout", "live Deployment")
    require(desired_container.get("image") == live_container.get("image"), "replica drift should not change the image")
    require(desired_container.get("resources") == live_container.get("resources"), "replica drift should not change resources")
    require(
        "autoscaling.platform.example.com/last-scale" in get_map(metadata(live, "live"), "annotations", "live.metadata"),
        "live manifest should include autoscaling ownership evidence",
    )

    ignore_spec = spec(ignore, "ignore Application")
    entries = get_list(ignore_spec, "ignoreDifferences", "ignore Application.spec")
    require(len(entries) == 1, "ignoreDifferences should contain one narrow entry")
    entry = mapping(entries[0], "ignoreDifferences entry")
    require(entry.get("group") == "apps" and entry.get("kind") == "Deployment", "ignore rule should target apps/Deployment")
    require(entry.get("name") == "checkout" and entry.get("namespace") == "payments", "ignore rule should target payments/checkout")
    require(entry.get("jsonPointers") == ["/spec/replicas"], "ignore rule should ignore only /spec/replicas")
    require("jqPathExpressions" not in entry and "managedFieldsManagers" not in entry, "ignore rule should not broaden matching")


def verify_design_safe_release_pipeline() -> None:
    slug = "design-safe-release-pipeline"
    unsafe = yaml_doc(slug, "pipeline.yaml")
    safe = yaml_doc(slug, "safe-pipeline.yaml")
    unsafe_jobs = get_map(unsafe, "jobs", "unsafe workflow")
    safe_jobs = get_map(safe, "jobs", "safe workflow")
    require(set(unsafe_jobs) == {"build", "deploy-prod"}, "unsafe workflow should only build and deploy prod")
    unsafe_deploy = get_map(unsafe_jobs, "deploy-prod", "unsafe jobs")
    unsafe_text = all_step_text(get_list(unsafe_deploy, "steps", "unsafe deploy-prod"))
    require(unsafe_deploy.get("if") == "github.ref == 'refs/heads/main'", "unsafe deploy should run directly from main")
    require(
        "helm upgrade --install checkout charts/checkout -f values/prod.yaml" in unsafe_text,
        "unsafe deploy should use the direct Helm command",
    )
    require(
        "deploy-staging" not in unsafe_jobs and "trivy" not in unsafe_text and "smoke.sh" not in unsafe_text,
        "unsafe workflow should lack staging, scanning, and smoke gates",
    )

    permissions = get_map(safe, "permissions", "safe workflow")
    require(permissions.get("contents") == "read", "safe workflow should minimize contents permission")
    require(permissions.get("id-token") == "write", "safe workflow should use identity federation")
    require(permissions.get("security-events") == "write", "safe workflow should publish security evidence")
    for job_name in ["build", "verify", "deploy-staging", "deploy-prod"]:
        require(job_name in safe_jobs, f"safe workflow missing {job_name}")
    verify_text = all_step_text(get_list(get_map(safe_jobs, "verify", "safe jobs"), "steps", "safe verify"))
    for token in ["trivy image", "syft", "helm template", "kubeconform", "conftest test"]:
        require(token in verify_text, f"safe verify job should include {token}")
    staging = get_map(safe_jobs, "deploy-staging", "safe jobs")
    prod = get_map(safe_jobs, "deploy-prod", "safe jobs")
    require(staging.get("environment") == "staging", "safe workflow should use staging environment")
    require(
        prod.get("needs") == "deploy-staging" and prod.get("environment") == "production",
        "safe prod deploy should require staging and approval",
    )
    prod_text = all_step_text(get_list(prod, "steps", "safe deploy-prod"))
    for token in ["--set rollout.strategy=canary", "smoke.sh", "rollback-if-slo-breach"]:
        require(token in prod_text, f"safe production job should include {token}")
    require(
        "helm upgrade --install checkout charts/checkout -f values/prod.yaml" not in prod_text,
        "safe prod deploy should not keep the unsafe command",
    )


def verify_write_slo_backed_runbook() -> None:
    slug = "write-slo-backed-runbook"
    rule = yaml_doc(slug, "prometheus-rule.yaml")
    require(rule.get("kind") == "PrometheusRule", "prometheus-rule.yaml should define a PrometheusRule")
    groups = get_list(spec(rule, "PrometheusRule"), "groups", "PrometheusRule.spec")
    rules = get_list(mapping(groups[0], "PrometheusRule group"), "rules", "PrometheusRule group")
    alert = mapping(rules[0], "PrometheusRule alert")
    require(alert.get("alert") == "CheckoutHighErrorBudgetBurn", "PrometheusRule should define the checkout burn alert")
    expr = get_str(alert, "expr", "PrometheusRule alert")
    require('status=~"5.."' in expr and 'service="checkout"' in expr, "alert should measure checkout 5xx rate")
    require("> 0.02" in expr, "alert should page above 2 percent 5xx")
    require(alert.get("for") == "10m", "alert should require 10 minutes before firing")
    labels = get_map(alert, "labels", "PrometheusRule alert")
    annotations = get_map(alert, "annotations", "PrometheusRule alert")
    require(labels.get("severity") == "page", "alert should be paging severity")
    require(
        str(annotations.get("dashboard", "")).startswith("https://grafana.example.com/d/checkout"),
        "alert should link the checkout dashboard",
    )


VERIFY_BY_LAB = {
    "trace-service-to-pod": verify_trace_service_to_pod,
    "debug-crashloop-imagepull": verify_debug_crashloop_imagepull,
    "trace-network-path": verify_trace_network_path,
    "debug-irsa-access-denied": verify_debug_irsa_access_denied,
    "trace-argocd-drift": verify_trace_argocd_drift,
    "design-safe-release-pipeline": verify_design_safe_release_pipeline,
    "write-slo-backed-runbook": verify_write_slo_backed_runbook,
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab", choices=PORTFOLIO_LABS, help="verify one portfolio-grade lab instead of all")
    args = parser.parse_args()

    labs = [args.lab] if args.lab else PORTFOLIO_LABS
    try:
        require(set(PORTFOLIO_LABS) == PORTFOLIO_LAB_SLUGS, "portfolio lab verifier list should match API catalog metadata")
        for slug in labs:
            VERIFY_BY_LAB[slug]()
    except ArtifactFailure as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print(f"Verified structural artifacts for {len(labs)} Platform Academy portfolio labs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
