#!/usr/bin/env python3
"""Verify high-value Platform Academy lab artifacts structurally."""

from __future__ import annotations

import argparse
import csv
import json
import re
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
    "review-yaml-before-apply",
    "validate-helm-release-artifact",
    "diagnose-eks-ip-exhaustion",
    "design-production-eks-review",
    "trace-network-path",
    "debug-aws-alb-health-path",
    "review-terraform-eks-plan",
    "debug-irsa-access-denied",
    "audit-tenant-boundaries",
    "trace-argocd-drift",
    "design-safe-release-pipeline",
    "write-slo-backed-runbook",
    "design-opentelemetry-signal-path",
    "review-docker-image-supply-chain",
    "audit-eks-cost-drivers",
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


def csv_rows(slug: str, filename: str) -> list[dict[str, str]]:
    path = lab_path(slug, filename)
    with path.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    require(rows, f"{slug}/{filename} should contain CSV rows")
    return rows


def text_doc(slug: str, filename: str) -> str:
    return lab_path(slug, filename).read_text(encoding="utf-8")


def text_line_matching(text: str, pattern: str, label: str) -> str:
    for line in text.splitlines():
        if re.search(pattern, line):
            return line.strip()
    fail(f"missing {label}")


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


def verify_review_yaml_before_apply() -> None:
    slug = "review-yaml-before-apply"
    vendor = yaml_docs(slug, "vendor.yaml")
    safe = yaml_docs(slug, "safe-baseline.yaml")
    find_doc(vendor, "Namespace", "vendor-payments")
    secret = find_doc(vendor, "Secret", "vendor-api-token", "vendor-payments")
    cluster_role = find_doc(vendor, "ClusterRole", "vendor-platform-reader")
    deployment = find_doc(vendor, "Deployment", "vendor-agent", "vendor-payments")
    safe_deployment = find_doc(safe, "Deployment", "vendor-agent", "vendor-payments")

    require(secret.get("stringData") == {"token": "replace-me"}, "vendor Secret should expose the token placeholder review point")
    rules = get_list(cluster_role, "rules", "vendor ClusterRole")
    require(len(rules) == 1, "vendor ClusterRole should contain one focused evidence rule")
    rule = mapping(rules[0], "vendor ClusterRole rule")
    require(
        set(get_list(rule, "resources", "vendor ClusterRole rule")) == {"pods", "secrets"},
        "vendor ClusterRole should grant pod and secret access",
    )
    require(
        {"get", "list", "watch"}.issubset(set(get_list(rule, "verbs", "vendor ClusterRole rule"))),
        "vendor ClusterRole should grant get/list/watch evidence",
    )

    selector = deployment_selector(deployment, "vendor Deployment")
    labels = deployment_pod_labels(deployment, "vendor Deployment")
    require(selector == {"app": "vendor-agent"} and selector.items() <= labels.items(), "vendor Deployment selector should match Pods")
    container = deployment_container(deployment, "agent", "vendor Deployment")
    require(container.get("image") == "busybox:1.36", "vendor Deployment should use the expected sample image")
    security_context = get_map(container, "securityContext", "vendor Deployment container")
    require(security_context.get("privileged") is True, "vendor Deployment should request privileged runtime")
    template = get_map(spec(deployment, "vendor Deployment"), "template", "vendor Deployment.spec")
    pod_spec = get_map(template, "spec", "vendor Deployment.template")
    volumes = get_list(pod_spec, "volumes", "vendor Pod spec")
    require(
        any(mapping(volume, "vendor volume").get("hostPath", {}).get("path") == "/" for volume in volumes),
        "vendor Deployment should mount hostPath /",
    )

    safe_kinds = {str(document.get("kind", "")) for document in safe}
    require("ClusterRole" not in safe_kinds, "safe baseline should remove the ClusterRole")
    require("Secret" not in safe_kinds, "safe baseline should remove committed Secret material")
    safe_selector = deployment_selector(safe_deployment, "safe Deployment")
    safe_labels = deployment_pod_labels(safe_deployment, "safe Deployment")
    require(safe_selector == selector and safe_selector.items() <= safe_labels.items(), "safe Deployment should preserve matching labels")
    safe_container = deployment_container(safe_deployment, "agent", "safe Deployment")
    safe_security_context = get_map(safe_container, "securityContext", "safe Deployment container")
    require(safe_security_context.get("allowPrivilegeEscalation") is False, "safe Deployment should disable privilege escalation")
    require(safe_security_context.get("readOnlyRootFilesystem") is True, "safe Deployment should use a read-only root filesystem")
    require(safe_security_context.get("privileged") is not True, "safe Deployment should not be privileged")
    safe_template = get_map(spec(safe_deployment, "safe Deployment"), "template", "safe Deployment.spec")
    safe_pod_spec = get_map(safe_template, "spec", "safe Deployment.template")
    require(not safe_pod_spec.get("volumes"), "safe Deployment should remove the hostPath volume")


def verify_validate_helm_release_artifact() -> None:
    slug = "validate-helm-release-artifact"
    before = yaml_docs(slug, "rendered-before.yaml")
    after = yaml_docs(slug, "rendered-after.yaml")
    safe = yaml_docs(slug, "safe-rendered-after.yaml")
    review = text_doc(slug, "review-notes.md")
    triage = text_doc(slug, "triage-notes.md")

    before_deployment = find_doc(before, "Deployment", "checkout", "payments")
    after_deployment = find_doc(after, "Deployment", "checkout", "payments")
    after_service = find_doc(after, "Service", "checkout", "payments")
    safe_deployment = find_doc(safe, "Deployment", "checkout", "payments")
    safe_service = find_doc(safe, "Service", "checkout", "payments")

    stable_selector = {"app.kubernetes.io/name": "checkout"}
    unsafe_selector = {"app": "checkout"}
    require(deployment_selector(before_deployment, "before Deployment") == stable_selector, "before Deployment should use stable selector")
    require(
        deployment_pod_labels(before_deployment, "before Deployment") == stable_selector,
        "before Deployment Pod labels should match stable selector",
    )
    before_container = deployment_container(before_deployment, "checkout", "before Deployment")
    require(before_container.get("image") == "registry.example.com/checkout@sha256:1111", "before image should be digest-pinned")
    before_security = get_map(before_container, "securityContext", "before Deployment container")
    require(before_security.get("runAsNonRoot") is True, "before render should require non-root")
    require(before_security.get("allowPrivilegeEscalation") is False, "before render should disable privilege escalation")

    require(deployment_selector(after_deployment, "after Deployment") == unsafe_selector, "after Deployment should change selector")
    require(
        deployment_pod_labels(after_deployment, "after Deployment") == unsafe_selector,
        "after Pod labels should match changed selector",
    )
    after_container = deployment_container(after_deployment, "checkout", "after Deployment")
    require(after_container.get("image") == "registry.example.com/checkout:latest", "after image should regress to latest")
    require(
        get_map(after_container, "securityContext", "after Deployment container").get("privileged") is True,
        "after render should make the container privileged",
    )
    require(spec(after_service, "after Service").get("type") == "LoadBalancer", "after Service should expose a LoadBalancer")
    require(
        get_map(spec(after_service, "after Service"), "selector", "after Service.spec") == unsafe_selector,
        "after Service selector should match",
    )
    require(service_port(after_service, "http", "after Service").get("targetPort") == "http", "after Service should preserve targetPort")

    require(deployment_selector(safe_deployment, "safe Deployment") == stable_selector, "safe Deployment should keep stable selector")
    require(deployment_pod_labels(safe_deployment, "safe Deployment") == stable_selector, "safe Pod labels should match stable selector")
    safe_container = deployment_container(safe_deployment, "checkout", "safe Deployment")
    require(safe_container.get("image") == "registry.example.com/checkout@sha256:2222", "safe image should promote by digest")
    safe_security = get_map(safe_container, "securityContext", "safe Deployment container")
    require(safe_security.get("runAsNonRoot") is True, "safe render should require non-root")
    require(safe_security.get("allowPrivilegeEscalation") is False, "safe render should disable privilege escalation")
    require(safe_security.get("privileged") is not True, "safe render should not be privileged")
    require(spec(safe_service, "safe Service").get("type") == "ClusterIP", "safe Service should stay internal")
    require(
        get_map(spec(safe_service, "safe Service"), "selector", "safe Service.spec") == stable_selector,
        "safe Service selector should match",
    )
    require(service_port(safe_service, "http", "safe Service").get("targetPort") == "http", "safe Service should preserve targetPort")

    for term in ["Block the release", "selector compatibility", "image immutability", "Service exposure"]:
        require(term in review, f"Helm review notes should include {term}")
    for term in ["successful Helm render is not release approval", "immutable selector", "checkout:latest", "LoadBalancer"]:
        require(term in triage, f"Helm triage notes should rule out or flag {term}")


def verify_diagnose_eks_ip_exhaustion() -> None:
    slug = "diagnose-eks-ip-exhaustion"
    snapshot = text_doc(slug, "cluster-snapshot.txt")
    plan = text_doc(slug, "remediation-plan.md")
    decision = text_doc(slug, "decision-record.md")

    require(
        "FailedScheduling 0/3 nodes are available: 3 Insufficient pods" in snapshot,
        "snapshot should show pod-density scheduling pressure",
    )
    require(
        "FailedCreatePodSandBox failed to assign an IP address" in snapshot,
        "snapshot should show sandbox IP assignment failure",
    )
    subnets = {
        subnet: int(count)
        for subnet, count in re.findall(r"(subnet-[a-z0-9]+) [a-z0-9-]+ AvailableIPv4AddressCount=([0-9]+)", snapshot)
    }
    require(
        subnets == {"subnet-aaa111": 18, "subnet-bbb222": 7, "subnet-ccc333": 41},
        "snapshot should preserve subnet IP inventory",
    )
    node_matches = re.findall(r"maxPods=([0-9]+)\s+runningPods=([0-9]+)", snapshot)
    require(len(node_matches) == 3, "snapshot should include three node pod-density rows")
    near_max = [
        (int(max_pods), int(running_pods))
        for max_pods, running_pods in node_matches
        if int(running_pods) >= int(max_pods) - 1
    ]
    require(len(near_max) == 3, "snapshot should show all nodes at or near maxPods")
    require("subnet subnet-bbb222 has insufficient free IPv4 addresses" in snapshot, "snapshot should include aws-node subnet failure")
    require("prefix delegation disabled on nodegroup payments-ng" in snapshot, "snapshot should include prefix delegation state")

    for term in ["Pause the checkout scale-up", "Do not randomly recycle Pods", "Enable VPC CNI prefix delegation", "Rollback"]:
        require(term in plan, f"remediation plan should include {term}")
    for owner in ["App owner", "Platform owner", "Network owner", "Release owner"]:
        require(owner in plan, f"remediation plan should assign {owner}")
    for term in ["not an application restart problem", "Blind node scaling: rejected", "capacity alerts"]:
        require(term in decision, f"decision record should include {term}")


def verify_design_production_eks_review() -> None:
    slug = "design-production-eks-review"
    triage = text_doc(slug, "triage-notes.md")
    review = text_doc(slug, "cluster-review.md")
    launch = text_doc(slug, "launch-review.md")
    template = text_doc(slug, "evidence-template.md")
    analyzer = text_doc(slug, "production_review_analyzer.py")

    for term in [
        "public and private endpoint is not launch approval",
        "One missing PDB is not a follow-up",
        "snapshot policy is not restore proof",
        "Cost labels are not optional after launch",
        "Managed controller add-ons do not remove upgrade risk",
        "blocked launch decision with owners",
    ]:
        require(term in triage, f"production EKS triage notes should include {term}")

    for term in [
        "Name: academy-prod",
        "Region: us-west-2",
        "Endpoint: public and private",
        "Node groups: system, apps, stateful",
        "NAT gateway per AZ is planned",
        "LoadBalancer review is manual",
        "No idle-request report exists",
        "Check deprecated APIs before control-plane upgrade",
        "controller add-ons have no version compatibility matrix",
        "PDBs block managed node group rotation",
    ]:
        require(term in review, f"production EKS cluster review should include {term}")

    system_line = text_line_matching(
        review,
        r"system-a\s+zone=us-west-2a\s+taints=CriticalAddonsOnly=true:NoSchedule",
        "system node group placement",
    )
    require("CriticalAddonsOnly" in system_line, "system node group should be tainted for platform add-ons")
    apps_a = text_line_matching(review, r"apps-a\s+zone=us-west-2a", "apps-a placement")
    apps_b = text_line_matching(review, r"apps-b\s+zone=us-west-2b", "apps-b placement")
    apps_c = text_line_matching(review, r"apps-c\s+zone=us-west-2c", "apps-c placement")
    require("cost-center=platform" in apps_a and "cost-center=platform" in apps_b, "apps-a/apps-b should be labeled for cost ownership")
    require("cost-center" not in apps_c, "apps-c should preserve the missing cost-center label risk")
    require(
        "stateful-a zone=us-west-2a" in review and "labels=workload=stateful" in review,
        "stateful node group should expose single-AZ stateful placement",
    )

    checkout = text_line_matching(review, r"payments/checkout", "checkout workload")
    worker = text_line_matching(review, r"payments/worker", "worker workload")
    postgres = text_line_matching(review, r"data/postgres", "postgres workload")
    alb = text_line_matching(review, r"ingress/alb", "ingress workload")
    require(
        "replicas=3" in checkout
        and all(zone in checkout for zone in ["us-west-2a", "us-west-2b", "us-west-2c"])
        and "pdb=maxUnavailable:1" in checkout,
        "checkout should show a multi-AZ workload with a PDB",
    )
    require(
        "replicas=1" in worker and "spread=us-west-2a" in worker and "pdb=missing" in worker,
        "payments/worker should expose single-AZ placement and missing PDB",
    )
    require(
        "replicas=1" in postgres and "volume=gp3-us-west-2a" in postgres and "recovery=restore-from-snapshot" in postgres,
        "data/postgres should expose zonal storage and snapshot-only recovery evidence",
    )
    require(
        "replicas=2" in alb and "us-west-2a" in alb and "us-west-2b" in alb,
        "ingress/alb should expose two-AZ placement evidence",
    )
    require("Missing cost label on apps-c" in review, "cluster review should preserve the FinOps blocker")

    for term in [
        "Block production launch",
        "`payments/worker` has `pdb=missing`",
        "restore proof is required before launch",
        "`apps-c` is missing a `cost-center` label",
        "Controller add-ons have no documented version compatibility matrix",
        "Deprecated API check is listed as a pause point but has no recorded output",
        "Decide whether public endpoint access is required or should be narrowed",
        "Automate idle LoadBalancer review",
        "Add idle request and over-request reports",
        "Document NAT gateway cost expectations",
        "Platform owner",
        "App owner",
        "Data owner",
        "FinOps owner",
        "PDB exists for every critical workload",
        "Restore drill proves the stateful recovery path",
        "Every node group has cost labels",
        "deprecated API scan and add-on compatibility matrix",
    ]:
        require(term in launch, f"production EKS launch review should include {term}")
    require(
        re.search(r"## Launch Blockers\b.*## Follow-Up Improvements", launch, re.DOTALL) is not None,
        "launch review should separate blockers from follow-up improvements",
    )

    for heading in [
        "## Triage Notes And False Leads",
        "## Access And Resilience Evidence",
        "## Cost And Upgrade Evidence",
        "## Launch Decision Evidence",
    ]:
        require(heading in template, f"production EKS evidence template should include {heading}")
    for term in ["Production EKS review analysis passed", "payments/worker is single-AZ", "Owner split"]:
        require(term in analyzer, f"production EKS analyzer should include {term}")


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


def verify_debug_aws_alb_health_path() -> None:
    slug = "debug-aws-alb-health-path"
    health = json_doc(slug, "target-health.json")
    events = text_doc(slug, "events.txt")
    broken = yaml_docs(slug, "ingress-service.yaml")
    fixed = yaml_docs(slug, "fixed-ingress-service.yaml")
    triage = text_doc(slug, "triage-notes.md")

    descriptions = get_list(health, "TargetHealthDescriptions", "target-health")
    target_rows = [mapping(item, "target health description") for item in descriptions]
    unhealthy_rows = [
        row
        for row in target_rows
        if get_map(row, "TargetHealth", "target health description").get("State") == "unhealthy"
        and get_map(row, "TargetHealth", "target health description").get("Reason") == "Target.ResponseCodeMismatch"
    ]
    require(len(unhealthy_rows) == 1, "target-health should include one unhealthy ResponseCodeMismatch target")
    unhealthy_health = get_map(unhealthy_rows[0], "TargetHealth", "unhealthy target")
    unhealthy_target = get_map(unhealthy_rows[0], "Target", "unhealthy target")
    require(unhealthy_target.get("Port") == 8080, "unhealthy ALB target should be port 8080")
    require("404" in str(unhealthy_health.get("Description", "")), "unhealthy ALB target should report HTTP 404")
    require(
        any(get_map(row, "TargetHealth", "target health description").get("State") == "healthy" for row in target_rows),
        "target-health should include a healthy target for comparison",
    )

    broken_ingress = find_doc(broken, "Ingress", "checkout", "payments")
    broken_service = find_doc(broken, "Service", "checkout", "payments")
    broken_pod = find_doc(broken, "Pod", "checkout-example", "payments")
    fixed_ingress = find_doc(fixed, "Ingress", "checkout", "payments")
    fixed_service = find_doc(fixed, "Service", "checkout", "payments")
    fixed_pod = find_doc(fixed, "Pod", "checkout-example", "payments")

    broken_annotations = get_map(metadata(broken_ingress, "broken Ingress"), "annotations", "broken Ingress.metadata")
    fixed_annotations = get_map(metadata(fixed_ingress, "fixed Ingress"), "annotations", "fixed Ingress.metadata")
    require(
        broken_annotations.get("alb.ingress.kubernetes.io/healthcheck-path") == "/healthz",
        "broken Ingress should point ALB health checks at /healthz",
    )
    require(
        broken_annotations.get("alb.ingress.kubernetes.io/success-codes") == "200",
        "broken Ingress should expect HTTP 200 health checks",
    )
    require(
        fixed_annotations.get("alb.ingress.kubernetes.io/healthcheck-path") == "/",
        "fixed Ingress should point ALB health checks at /",
    )
    require(fixed_annotations.get("alb.ingress.kubernetes.io/success-codes") == "200", "fixed Ingress should still expect HTTP 200")

    broken_rules = get_list(spec(broken_ingress, "broken Ingress"), "rules", "broken Ingress.spec")
    broken_rule = mapping(broken_rules[0], "broken Ingress rule")
    require(broken_rule.get("host") == "checkout.example.com", "broken Ingress should route checkout.example.com")
    broken_paths = get_list(get_map(broken_rule, "http", "broken Ingress rule"), "paths", "broken Ingress rule.http")
    broken_backend = get_map(get_map(mapping(broken_paths[0], "broken path"), "backend", "broken path"), "service", "broken path.backend")
    require(broken_backend.get("name") == "checkout", "broken Ingress should route to checkout Service")
    require(get_map(broken_backend, "port", "broken backend service").get("name") == "http", "broken backend should use Service port http")

    broken_target = service_port(broken_service, "http", "broken Service").get("targetPort")
    fixed_target = service_port(fixed_service, "http", "fixed Service").get("targetPort")
    broken_ports = container_port_names(pod_container(broken_pod, "checkout", "broken Pod"), "broken Pod checkout")
    fixed_ports = container_port_names(pod_container(fixed_pod, "checkout", "fixed Pod"), "fixed Pod checkout")
    require(
        get_map(spec(broken_service, "broken Service"), "selector", "broken Service.spec") == {"app": "checkout"},
        "broken Service selector should target checkout Pods",
    )
    require(
        get_map(spec(fixed_service, "fixed Service"), "selector", "fixed Service.spec") == {"app": "checkout"},
        "fixed Service selector should target checkout Pods",
    )
    require(broken_target == "web" and "web" not in broken_ports, "broken Service should target missing Pod port name web")
    require(fixed_target == "http" and "http" in fixed_ports, "fixed Service should target the Pod port name http")
    require(
        pod_container(broken_pod, "checkout", "broken Pod").get("image") == "python:3.12-alpine",
        "broken Pod should use the sample HTTP server image",
    )
    broken_command = get_list(pod_container(broken_pod, "checkout", "broken Pod"), "command", "broken Pod container")
    require("http.server" in " ".join(str(item) for item in broken_command), "broken Pod should run the sample HTTP server")

    for term in ["Target.ResponseCodeMismatch", "targetPort web has no matching Pod port name"]:
        require(term in events, f"events should include {term}")
    for term in ["Target.ResponseCodeMismatch", "targetPort: web", "console-only", "Security groups"]:
        require(term in triage, f"ALB triage notes should rule out or flag {term}")


def verify_review_terraform_eks_plan() -> None:
    slug = "review-terraform-eks-plan"
    plan = text_doc(slug, "tfplan.txt")
    review = text_doc(slug, "review.md")
    decision = text_doc(slug, "decision-record.md")

    require("module.eks.aws_eks_node_group.apps must be replaced" in plan, "Terraform plan should replace the apps node group")
    subnet_match = re.search(r'~ subnet_ids\s+=\s+\[([^\]]+)\]\s+->\s+\[([^\]]+)\]', plan, flags=re.MULTILINE)
    require(subnet_match is not None, "Terraform plan should expose before/after subnet IDs")
    before_subnets = set(re.findall(r'"([^"]+)"', subnet_match.group(1) if subnet_match else ""))
    after_subnets = set(re.findall(r'"([^"]+)"', subnet_match.group(2) if subnet_match else ""))
    require(before_subnets == {"subnet-aaa111", "subnet-bbb222"}, "Terraform plan should start with two known subnets")
    require(after_subnets == {"subnet-bbb222"}, "Terraform plan should regress to one subnet")

    capacity_match = re.search(
        r"desired_size\s+=\s+([0-9]+)\s+->\s+([0-9]+).*?max_size\s+=\s+([0-9]+)\s+->\s+([0-9]+)",
        plan,
        flags=re.DOTALL,
    )
    require(capacity_match is not None, "Terraform plan should expose desired and max capacity changes")
    desired_before, desired_after, max_before, max_after = (
        [int(value) for value in capacity_match.groups()] if capacity_match else [0, 0, 0, 0]
    )
    require((desired_before, desired_after) == (6, 3), "Terraform plan should reduce desired capacity from 6 to 3")
    require((max_before, max_after) == (12, 6), "Terraform plan should reduce max capacity from 12 to 6")

    require('cidr_blocks = ["0.0.0.0/0"]' in plan, "Terraform plan should add public API ingress evidence")
    require('Action   = "eks:*"' in plan and 'Resource = "*"' in plan, "Terraform plan should include broad EKS IAM evidence")
    require("Plan: 2 to add, 1 to change, 1 to destroy." in plan, "Terraform plan summary should preserve add/change/destroy counts")
    require("Do not approve" in review and "Do not approve" in decision, "Terraform review and decision should block the plan")
    for term in ["multi-AZ", "rollback", "least-privilege", "Restrict API ingress"]:
        require(term in decision, f"Terraform decision should require {term}")


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


def role_ref(binding: dict[str, Any], label: str) -> dict[str, Any]:
    return get_map(binding, "roleRef", label)


def role_rule_with_resource(role: dict[str, Any], resource: str, label: str) -> dict[str, Any]:
    for item in get_list(role, "rules", label):
        rule = mapping(item, f"{label} rule")
        resources = {str(entry) for entry in sequence(rule.get("resources"), f"{label} resources")}
        if resource in resources:
            return rule
    fail(f"{label} missing resource {resource}")


def verify_audit_tenant_boundaries() -> None:
    slug = "audit-tenant-boundaries"
    risky = yaml_docs(slug, "tenant-a.yaml")
    fixed = yaml_docs(slug, "fixed-tenant-a.yaml")
    review = text_doc(slug, "review.md")
    triage = text_doc(slug, "triage-notes.md")

    risky_namespace = find_doc(risky, "Namespace", "tenant-a")
    risky_service_account = find_doc(risky, "ServiceAccount", "deployer", "tenant-a")
    risky_role = find_doc(risky, "Role", "app-reader", "tenant-a")
    risky_role_binding = find_doc(risky, "RoleBinding", "deployer-reader", "tenant-a")
    risky_policy = find_doc(risky, "NetworkPolicy", "allow-all-egress", "tenant-a")
    risky_admin_binding = find_doc(risky, "ClusterRoleBinding", "tenant-a-temporary-admin")

    require(
        metadata(risky_service_account, "risky ServiceAccount").get("namespace") == "tenant-a",
        "risky ServiceAccount should be tenant-scoped",
    )
    risky_labels = get_map(metadata(risky_namespace, "risky Namespace"), "labels", "risky Namespace.metadata")
    require(
        risky_labels.get("pod-security.kubernetes.io/enforce") == "baseline",
        "risky Namespace should enforce baseline Pod Security",
    )
    pod_rule = role_rule_with_resource(risky_role, "pods", "risky Role")
    service_rule = role_rule_with_resource(risky_role, "services", "risky Role")
    secret_rule = role_rule_with_resource(risky_role, "secrets", "risky Role")
    for rule, resource in [(pod_rule, "pods"), (service_rule, "services"), (secret_rule, "secrets")]:
        require(
            {"get", "list", "watch"}.issubset({str(verb) for verb in sequence(rule.get("verbs"), f"risky Role {resource} verbs")}),
            f"risky Role should grant get/list/watch for {resource}",
        )
    role_binding_ref = role_ref(risky_role_binding, "risky RoleBinding")
    require(
        role_binding_ref.get("kind") == "Role" and role_binding_ref.get("name") == "app-reader",
        "RoleBinding should target app-reader Role",
    )
    subjects = get_list(risky_role_binding, "subjects", "risky RoleBinding")
    require(
        any(
            mapping(subject, "risky RoleBinding subject").get("kind") == "ServiceAccount"
            and mapping(subject, "risky RoleBinding subject").get("name") == "deployer"
            and mapping(subject, "risky RoleBinding subject").get("namespace") == "tenant-a"
            for subject in subjects
        ),
        "RoleBinding should bind tenant-a/deployer",
    )
    admin_ref = role_ref(risky_admin_binding, "risky ClusterRoleBinding")
    require(
        admin_ref.get("kind") == "ClusterRole" and admin_ref.get("name") == "cluster-admin",
        "ClusterRoleBinding should bind cluster-admin",
    )
    admin_subjects = get_list(risky_admin_binding, "subjects", "risky ClusterRoleBinding")
    require(
        any(
            mapping(subject, "risky ClusterRoleBinding subject").get("kind") == "ServiceAccount"
            and mapping(subject, "risky ClusterRoleBinding subject").get("name") == "deployer"
            and mapping(subject, "risky ClusterRoleBinding subject").get("namespace") == "tenant-a"
            for subject in admin_subjects
        ),
        "ClusterRoleBinding should bind tenant-a/deployer",
    )
    risky_policy_spec = spec(risky_policy, "risky NetworkPolicy")
    require(risky_policy_spec.get("podSelector") == {}, "risky NetworkPolicy should select every tenant Pod")
    require(
        "Egress" in sequence(risky_policy_spec.get("policyTypes"), "risky NetworkPolicy policyTypes"),
        "risky policy should govern egress",
    )
    require(risky_policy_spec.get("egress") == [{}], "risky NetworkPolicy should allow all egress with an empty rule")

    fixed_kinds = {str(document.get("kind", "")) for document in fixed}
    require("ClusterRoleBinding" not in fixed_kinds, "fixed manifest should remove ClusterRoleBinding")
    fixed_namespace = find_doc(fixed, "Namespace", "tenant-a")
    fixed_role = find_doc(fixed, "Role", "app-reader", "tenant-a")
    fixed_role_binding = find_doc(fixed, "RoleBinding", "deployer-reader", "tenant-a")
    fixed_policy = find_doc(fixed, "NetworkPolicy", "default-deny-egress", "tenant-a")
    fixed_labels = get_map(metadata(fixed_namespace, "fixed Namespace"), "labels", "fixed Namespace.metadata")
    require(
        fixed_labels.get("pod-security.kubernetes.io/enforce") == "restricted",
        "fixed Namespace should enforce restricted Pod Security",
    )
    fixed_resources = {
        str(resource)
        for item in get_list(fixed_role, "rules", "fixed Role")
        for resource in sequence(mapping(item, "fixed Role rule").get("resources"), "fixed Role resources")
    }
    require("secrets" not in fixed_resources, "fixed Role should remove secret access")
    require({"pods", "services"}.issubset(fixed_resources), "fixed Role should keep read access to pods and services")
    fixed_ref = role_ref(fixed_role_binding, "fixed RoleBinding")
    require(fixed_ref.get("kind") == "Role" and fixed_ref.get("name") == "app-reader", "fixed RoleBinding should keep app-reader scope")
    fixed_policy_spec = spec(fixed_policy, "fixed NetworkPolicy")
    require(fixed_policy_spec.get("podSelector") == {}, "fixed NetworkPolicy should select every tenant Pod")
    require(
        "Egress" in sequence(fixed_policy_spec.get("policyTypes"), "fixed NetworkPolicy policyTypes"),
        "fixed policy should govern egress",
    )
    require("egress" not in fixed_policy_spec, "fixed NetworkPolicy should omit allow rules for default-deny egress")

    for term in ["Block onboarding", "secret access is narrowed", "egress is scoped", "owners and expiry dates"]:
        require(term in review, f"tenant review should include {term}")
    for term in ["temporary cluster-admin", "NetworkPolicy object is not a boundary", "Client-side dry-run proves YAML parseability"]:
        require(term in triage, f"tenant triage notes should rule out {term}")


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


def verify_design_opentelemetry_signal_path() -> None:
    slug = "design-opentelemetry-signal-path"
    collector = yaml_doc(slug, "collector.yaml")
    risky_rule = yaml_doc(slug, "prometheus-rule.yaml")
    safe_rule = yaml_doc(slug, "safe-prometheus-rule.yaml")
    logs = text_doc(slug, "checkout-logs.txt")
    triage = text_doc(slug, "triage-notes.md")
    decision = text_doc(slug, "signal-path-decision.md")
    analyzer = text_doc(slug, "signal_path_analyzer.py")

    require(collector.get("kind") == "OpenTelemetryCollector", "collector should define an OpenTelemetryCollector")
    require(metadata(collector, "collector").get("name") == "platform", "collector should be named platform")
    require(metadata(collector, "collector").get("namespace") == "observability", "collector should live in observability")
    collector_config = get_map(spec(collector, "collector"), "config", "collector.spec")
    receiver = get_map(get_map(collector_config, "receivers", "collector.config"), "otlp", "collector.receivers")
    protocols = get_map(receiver, "protocols", "collector.receivers.otlp")
    require({"grpc", "http"}.issubset(protocols), "collector should receive OTLP over gRPC and HTTP")
    processors = get_map(collector_config, "processors", "collector.config")
    require("batch" in processors, "collector should keep the batch processor")
    drop_sensitive = get_map(processors, "attributes/drop-sensitive", "collector.processors")
    actions = get_list(drop_sensitive, "actions", "collector drop-sensitive processor")
    require(len(actions) == 1, "collector should define one sensitive-attribute action")
    action = mapping(actions[0], "collector drop-sensitive action")
    require(
        action.get("key") == "http.request.header.authorization" and action.get("action") == "delete",
        "collector should delete http.request.header.authorization before export",
    )
    exporter = get_map(get_map(collector_config, "exporters", "collector.config"), "otlphttp", "collector.exporters")
    require(exporter.get("endpoint") == "https://telemetry.example.com", "collector should use the sample OTLP HTTP endpoint")
    traces = get_map(
        get_map(get_map(collector_config, "service", "collector.config"), "pipelines", "collector.service"),
        "traces",
        "collector.service.pipelines",
    )
    require(traces.get("receivers") == ["otlp"], "traces pipeline should receive OTLP")
    require(
        traces.get("processors") == ["batch", "attributes/drop-sensitive"],
        "traces pipeline should batch then drop sensitive attributes",
    )
    require(traces.get("exporters") == ["otlphttp"], "traces pipeline should export through otlphttp")

    risky_group = mapping(get_list(spec(risky_rule, "risky rule"), "groups", "risky rule.spec")[0], "risky group")
    safe_group = mapping(get_list(spec(safe_rule, "safe rule"), "groups", "safe rule.spec")[0], "safe group")
    risky_alert = mapping(get_list(risky_group, "rules", "risky group")[0], "risky alert")
    safe_alert = mapping(get_list(safe_group, "rules", "safe group")[0], "safe alert")
    require(risky_alert.get("alert") == "CheckoutP95LatencyHigh", "risky rule should alert on checkout p95 latency")
    require(safe_alert.get("alert") == "CheckoutP95LatencyHigh", "safe rule should preserve the alert name")
    risky_expr = get_str(risky_alert, "expr", "risky alert")
    safe_expr = get_str(safe_alert, "expr", "safe alert")
    require(
        "histogram_quantile(0.95" in risky_expr and 'service="checkout"' in risky_expr,
        "risky rule should measure checkout p95 latency",
    )
    require("sum by (le, route, customer_email)" in risky_expr, "risky rule should expose customer_email cardinality risk")
    require(risky_alert.get("for") == "15m", "risky alert should use the captured 15 minute window")
    require("sum by (le, route)" in safe_expr, "safe rule should aggregate by le and route only")
    require("customer_email" not in safe_expr, "safe rule should remove customer_email")
    require(safe_alert.get("for") == "15m", "safe alert should preserve the evaluation window")
    safe_labels = get_map(safe_alert, "labels", "safe alert")
    safe_annotations = get_map(safe_alert, "annotations", "safe alert")
    require(safe_labels.get("severity") == "page", "safe rule should keep paging severity")
    require(
        str(safe_annotations.get("dashboard", "")).startswith("https://grafana.example.com/d/checkout-latency"),
        "safe rule should include the latency dashboard",
    )

    require(re.search(r"trace_id=[0-9a-f]{32}\b", logs) is not None, "logs should include a valid trace ID")
    require("service=checkout" in logs and "trace_id=missing" in logs, "logs should expose missing checkout trace context")
    require("cardinality_label=customer_email" in logs, "logs should preserve customer_email cardinality clue")
    for term in [
        "Dropping authorization headers does not prove",
        "One valid trace ID does not make",
        "Customer-level alert grouping",
        "A simulator sample does not replace an owner map",
        "No live backend change does not remove",
    ]:
        require(term in triage, f"OpenTelemetry triage notes should include {term}")
    for term in [
        "Keep sensitive-header deletion",
        "fix missing trace context",
        "remove user-level labels",
        "App owner: propagate trace context",
        "Platform telemetry owner",
        "SRE owner",
        "Data/privacy owner",
        "Alert groups by route, not customer email",
        "Collector still drops authorization headers",
    ]:
        require(term in decision, f"OpenTelemetry decision should include {term}")
    for term in ["OpenTelemetry signal path analysis passed", "customer_email", "safe_labels"]:
        require(term in analyzer, f"OpenTelemetry analyzer should include {term}")


def verify_review_docker_image_supply_chain() -> None:
    slug = "review-docker-image-supply-chain"
    dockerfile = text_doc(slug, "Dockerfile")
    inspect = json_doc(slug, "image-inspect.json")
    history = text_doc(slug, "history.txt")
    hardened = text_doc(slug, "hardened.Dockerfile")
    promotion = text_doc(slug, "promotion-note.md")
    triage = text_doc(slug, "triage-notes.md")
    template = text_doc(slug, "evidence-template.md")
    analyzer = text_doc(slug, "supply_chain_analyzer.py")
    secret = "API_TOKEN=do-not-bake-secrets"

    for term in [
        "FROM node:22 AS build",
        "WORKDIR /app",
        "COPY . .",
        "RUN npm install",
        "RUN npm run build",
        "FROM node:22",
        f"ENV {secret}",
        "COPY --from=build /app .",
        "EXPOSE 3000",
        'CMD ["npm", "start"]',
    ]:
        require(term in dockerfile, f"Dockerfile should include {term}")
    require("\nUSER " not in dockerfile, "starting Dockerfile should not set a non-root runtime user")

    require(inspect.get("RepoTags") == ["checkout:latest"], "image inspect should preserve checkout:latest")
    require(inspect.get("RepoDigests") == [], "image inspect should preserve missing RepoDigests")
    config = get_map(inspect, "Config", "image inspect")
    require(config.get("User") == "", "image inspect should show blank/root runtime user")
    env = sequence(config.get("Env"), "image inspect Config.Env")
    require("NODE_ENV=production" in env and secret in env, "image inspect should include production env and baked secret")
    exposed = get_map(config, "ExposedPorts", "image inspect Config")
    require("3000/tcp" in exposed, "image inspect should expose port 3000/tcp")

    for term in [secret, "COPY /app . # build output plus source tree", "FROM node:22"]:
        require(term in history, f"image history should include {term}")

    for term in [
        "FROM node:22-bookworm-slim AS deps",
        "RUN npm ci",
        "FROM deps AS build",
        "FROM node:22-bookworm-slim AS runtime",
        "ENV NODE_ENV=production",
        "npm ci --omit=dev",
        "COPY --from=build --chown=node:node /app/dist ./dist",
        "USER node",
        'CMD ["node", "dist/server.js"]',
    ]:
        require(term in hardened, f"hardened Dockerfile should include {term}")
    require("API_TOKEN" not in hardened, "hardened Dockerfile should not contain secret material")
    require("COPY --from=build /app ." not in hardened, "hardened Dockerfile should not copy the whole app tree")

    for term in [
        "Block promotion of `checkout:latest`",
        "Immutable image digest",
        "SBOM artifact",
        "Vulnerability scan",
        "Runtime user set to non-root",
        "No secrets in Dockerfile",
        "Rollback digest",
        "Promote only by digest",
    ]:
        require(term in promotion, f"promotion note should include {term}")
    for term in [
        "`latest` is not acceptable promotion evidence",
        "Deleting a secret in a later Dockerfile layer",
        "runAsNonRoot",
        "Copying the full build tree into runtime",
        "SBOM and vulnerability scans after promotion",
        "rollback digest",
    ]:
        require(term in triage, f"Docker triage notes should include {term}")
    for heading in [
        "## Triage Notes And False Leads",
        "## Tag, Digest, And Promotion Evidence",
        "## Secret And Runtime Evidence",
        "## Release Handoff",
    ]:
        require(heading in template, f"Docker evidence template should include {heading}")
    for term in ["Docker supply-chain analysis passed", "checkout:latest", "RepoDigests", "rollback digest"]:
        require(term in analyzer, f"Docker supply-chain analyzer should include {term}")


def parse_space_table(text: str, columns: int, label: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in text.splitlines()[1:]:
        if not line.strip():
            continue
        parts = line.split()
        require(len(parts) == columns, f"{label} row should have {columns} columns: {line}")
        rows.append(parts)
    require(rows, f"{label} should include rows")
    return rows


def verify_audit_eks_cost_drivers() -> None:
    slug = "audit-eks-cost-drivers"
    usage = csv_rows(slug, "usage.csv")
    services = text_doc(slug, "services.txt")
    storage = text_doc(slug, "storage.txt")
    recommendations = text_doc(slug, "recommendations.md")
    triage = text_doc(slug, "triage-notes.md")
    template = text_doc(slug, "evidence-template.md")
    analyzer = text_doc(slug, "cost_analyzer.py")

    usage_by_name = {f"{row['namespace']}/{row['workload']}": row for row in usage}
    expected_usage_names = {"payments/checkout", "payments/worker", "observability/loki", "default/load-test", "data/postgres"}
    require(set(usage_by_name) == expected_usage_names, "usage.csv should preserve the expected workload set")

    checkout = usage_by_name["payments/checkout"]
    worker = usage_by_name["payments/worker"]
    load_test = usage_by_name["default/load-test"]
    loki = usage_by_name["observability/loki"]
    postgres = usage_by_name["data/postgres"]
    require(
        int(checkout["cpu_request_mcores"]) == 6000
        and int(checkout["cpu_usage_mcores"]) == 900
        and int(checkout["memory_request_mib"]) == 12288
        and int(checkout["memory_usage_mib"]) == 4096
        and checkout["owner"] == "team-payments",
        "payments/checkout should preserve over-requested usage evidence",
    )
    require(
        int(worker["cpu_request_mcores"]) == 4000
        and int(worker["cpu_usage_mcores"]) == 350
        and int(worker["memory_request_mib"]) == 8192
        and int(worker["memory_usage_mib"]) == 1024
        and worker["owner"] == "team-payments",
        "payments/worker should preserve over-requested usage evidence",
    )
    require(
        int(load_test["cpu_usage_mcores"]) == 0
        and int(load_test["memory_usage_mib"]) == 0
        and int(load_test["monthly_cost_usd"]) == 160
        and load_test["owner"] == "unknown",
        "default/load-test should be idle with unknown ownership",
    )
    require(
        int(loki["monthly_cost_usd"]) == 1180 and loki["owner"] == "platform",
        "observability/loki should remain a platform-owned architecture-review cost driver",
    )
    require(
        int(postgres["monthly_cost_usd"]) == 910 and postgres["owner"] == "data-platform",
        "data/postgres should remain a data-owned architecture-review cost driver",
    )

    service_rows = parse_space_table(services, 5, "services.txt")
    service_by_name = {f"{row[0]}/{row[1]}": row for row in service_rows}
    require("default/abandoned-demo" in service_by_name, "services.txt should include abandoned-demo")
    require(service_by_name["default/abandoned-demo"][2] == "LoadBalancer", "abandoned-demo should be a LoadBalancer")
    require(int(service_by_name["default/abandoned-demo"][4]) == 22, "abandoned-demo should preserve monthly cost estimate")
    require("observability/grafana-public" in service_by_name, "services.txt should keep observability exception evidence")

    storage_rows = parse_space_table(storage, 6, "storage.txt")
    storage_by_name = {f"{row[0]}/{row[1]}": row for row in storage_rows}
    abandoned_cache = storage_by_name.get("default/abandoned-cache")
    require(abandoned_cache is not None, "storage.txt should include abandoned-cache")
    require(
        abandoned_cache[2] == "200Gi" and abandoned_cache[3] == "gp2" and abandoned_cache[5] == "unknown",
        "abandoned-cache should preserve size, gp2 class, and unknown owner evidence",
    )
    require(
        storage_by_name.get("observability/loki-chunks", ["", "", "", "", "", ""])[2] == "2Ti",
        "storage.txt should keep Loki architecture-review storage evidence",
    )

    recommendation_rows = [
        line for line in recommendations.splitlines() if line.startswith("| ") and "---" not in line and "Finding" not in line
    ]
    require(len(recommendation_rows) == 5, "recommendations.md should contain five recommendation rows")
    for term in [
        "Checkout CPU over-requested",
        "Worker CPU and memory over-requested",
        "Default load-test has unknown owner and zero usage",
        "Abandoned demo LoadBalancer",
        "Abandoned cache PVC",
        "Expected Savings",
        "Reliability Risk",
        "Restore previous requests",
        "Snapshot before deletion",
        "Weekly: unknown owner and idle LoadBalancer report",
        "Monthly: workload request versus usage review",
        "Quarterly: storage class and retention review",
    ]:
        require(term in recommendations, f"cost recommendations should include {term}")
    for term in [
        "Low utilization is not automatic deletion approval",
        "Unknown owner means pause and confirm ownership",
        "LoadBalancer age is not enough",
        "PVC cleanup needs restore expectations",
        "Expensive observability or data workloads are architecture-review items",
        "Savings without reliability risk and rollback",
    ]:
        require(term in triage, f"cost triage notes should include {term}")
    for heading in [
        "## Triage Notes And False Leads",
        "## Compute Waste Evidence",
        "## Service And Storage Waste Evidence",
        "## Recommendation Evidence",
    ]:
        require(heading in template, f"cost evidence template should include {heading}")
    for term in ["EKS cost driver analysis passed", "quick_win_exposure", "architecture_review", "default/abandoned-cache"]:
        require(term in analyzer, f"cost analyzer should include {term}")


VERIFY_BY_LAB = {
    "trace-service-to-pod": verify_trace_service_to_pod,
    "debug-crashloop-imagepull": verify_debug_crashloop_imagepull,
    "review-yaml-before-apply": verify_review_yaml_before_apply,
    "validate-helm-release-artifact": verify_validate_helm_release_artifact,
    "diagnose-eks-ip-exhaustion": verify_diagnose_eks_ip_exhaustion,
    "design-production-eks-review": verify_design_production_eks_review,
    "trace-network-path": verify_trace_network_path,
    "debug-aws-alb-health-path": verify_debug_aws_alb_health_path,
    "review-terraform-eks-plan": verify_review_terraform_eks_plan,
    "debug-irsa-access-denied": verify_debug_irsa_access_denied,
    "audit-tenant-boundaries": verify_audit_tenant_boundaries,
    "trace-argocd-drift": verify_trace_argocd_drift,
    "design-safe-release-pipeline": verify_design_safe_release_pipeline,
    "write-slo-backed-runbook": verify_write_slo_backed_runbook,
    "design-opentelemetry-signal-path": verify_design_opentelemetry_signal_path,
    "review-docker-image-supply-chain": verify_review_docker_image_supply_chain,
    "audit-eks-cost-drivers": verify_audit_eks_cost_drivers,
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
