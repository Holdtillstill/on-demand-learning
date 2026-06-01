import os
import subprocess
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

import pytest
from pydantic import ValidationError

os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["REDIS_URL"] = "redis://localhost:6379/0"
os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = ""

from app.config import Settings  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app, request_windows, resolved_client_ip_from_headers, settings  # noqa: E402
from app.models import PlatformActivity, PlatformLabSubmission, Progress, ReviewState, UserAchievement, XpEvent  # noqa: E402
from app.platform_content import FULL_LAB_SLUGS as PLATFORM_FULL_LAB_SLUGS
from app.platform_content import (
    LAB_ARTIFACT_PATHS,  # noqa: E402
    PORTFOLIO_LAB_SLUGS,  # noqa: E402
)
from app.schemas import (  # noqa: E402
    MAX_PLATFORM_STATE_ACTIVITY_ROWS,
    MAX_PLATFORM_STATE_CHECKED_FIELDS,
    MAX_PLATFORM_STATE_LAB_ROWS,
    MAX_PLATFORM_STATE_PROGRESS_ROWS,
    MAX_PLATFORM_STATE_WORKSHEET_FIELDS,
    MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH,
    MAX_USER_ID_LENGTH,
    PLATFORM_LAB_STATUS_IN_PROGRESS,
    PLATFORM_LAB_STATUS_SUBMITTED,
    PLATFORM_STATE_TOKEN_PATTERN,
    USER_ID_PATTERN,
)
from app.seed import seed_database  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[3]

client = TestClient(app)
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
with SessionLocal() as db:
    seed_database(db)


@pytest.fixture(autouse=True)
def clear_rate_limit_windows():
    request_windows.clear()
    yield
    request_windows.clear()


FULL_LAB_SLUGS = sorted(PLATFORM_FULL_LAB_SLUGS)


def assert_no_store_headers(response, path: str):
    assert response.headers["Cache-Control"] == "no-store", path
    assert response.headers["Pragma"] == "no-cache", path


def assert_openapi_download_headers(response: dict, include_content_disposition: bool = True):
    headers = response.get("headers", {})
    assert headers["Cache-Control"]["schema"]["example"] == "no-store"
    assert headers["Pragma"]["schema"]["example"] == "no-cache"
    if include_content_disposition:
        assert "Content-Disposition" in headers


def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_client_ip_resolution_uses_forwarded_for_only_from_trusted_proxy():
    original_trusted_proxies = settings.trusted_proxy_cidrs
    try:
        settings.trusted_proxy_cidrs = "10.0.0.0/8"

        assert resolved_client_ip_from_headers("10.1.2.3", "198.51.100.10, 10.1.2.3", None) == "198.51.100.10"
        assert resolved_client_ip_from_headers("10.1.2.3", "not-an-ip", "198.51.100.12") == "198.51.100.12"
        assert resolved_client_ip_from_headers("203.0.113.5", "198.51.100.10", None) == "203.0.113.5"
    finally:
        settings.trusted_proxy_cidrs = original_trusted_proxies


def test_rate_limit_rejects_direct_client_after_threshold():
    request_windows.clear()
    original_limit = settings.rate_limit_per_minute
    try:
        settings.rate_limit_per_minute = 2
        assert client.get("/api/platform-academy/roadmap").status_code == 200
        assert client.get("/api/platform-academy/roadmap").status_code == 200

        limited = client.get("/api/platform-academy/roadmap")
        assert limited.status_code == 429
        assert limited.headers["retry-after"] == "60"
    finally:
        settings.rate_limit_per_minute = original_limit
        request_windows.clear()


def test_health_and_metrics_paths_are_rate_limit_exempt():
    request_windows.clear()
    original_limit = settings.rate_limit_per_minute
    original_exempt_paths = settings.rate_limit_exempt_paths
    try:
        settings.rate_limit_per_minute = 1
        settings.rate_limit_exempt_paths = "/healthz,/metrics"

        assert client.get("/healthz").status_code == 200
        assert client.get("/healthz").status_code == 200
        assert client.get("/metrics").status_code == 200
        assert client.get("/metrics").status_code == 200
    finally:
        settings.rate_limit_per_minute = original_limit
        settings.rate_limit_exempt_paths = original_exempt_paths
        request_windows.clear()


def test_cors_preflight_allows_configured_origin_and_rejects_unknown_origin():
    for origin in ["http://localhost:8090", "http://127.0.0.1:5174"]:
        allowed = client.options(
            "/api/platform-academy/catalog",
            headers={
                "origin": origin,
                "access-control-request-method": "GET",
            },
        )
        assert allowed.status_code == 200
        assert allowed.headers["access-control-allow-origin"] == origin

    rejected = client.options(
        "/api/platform-academy/catalog",
        headers={
            "origin": "https://not-configured.example.com",
            "access-control-request-method": "GET",
        },
    )
    assert rejected.status_code == 400
    assert "access-control-allow-origin" not in rejected.headers


def test_settings_reject_unsafe_public_runtime_config():
    invalid_settings = [
        {"cors_origins": "*"},
        {"cors_origins": "null"},
        {"cors_origins": "https://academy.example.com\nhttps://evil.example.com"},
        {"cors_origins": "academy.example.com"},
        {"cors_origins": "https://academy.example.com/path"},
        {"cors_origins": "https://academy.example.com?preview=true"},
        {"trusted_proxy_cidrs": "0.0.0.0/0"},
        {"trusted_proxy_cidrs": "::/0"},
        {"trusted_proxy_cidrs": "not-a-cidr"},
        {"rate_limit_exempt_paths": "healthz,/metrics"},
        {"rate_limit_exempt_paths": "/"},
        {"rate_limit_exempt_paths": "/api"},
        {"rate_limit_exempt_paths": "/api/platform-academy/catalog"},
        {"rate_limit_per_minute": -1},
        {"environment": "preview", "platform_source_bundle_public": True},
    ]

    for overrides in invalid_settings:
        with pytest.raises(ValidationError):
            Settings(**overrides)


def test_settings_accept_safe_preview_runtime_config():
    preview_settings = Settings(
        environment="preview",
        cors_origins="https://preview.academy.example.com,https://academy.example.com",
        trusted_proxy_cidrs="10.0.0.0/8,2001:db8::/32",
        rate_limit_exempt_paths="/healthz,/readyz,/metrics",
        rate_limit_per_minute=120,
    )

    assert preview_settings.cors_origin_list == ["https://preview.academy.example.com", "https://academy.example.com"]
    assert preview_settings.rate_limit_exempt_path_set == {"/healthz", "/readyz", "/metrics"}


def test_dynamic_academy_and_learner_api_responses_disable_caching():
    paths = [
        "/api/platform-academy/catalog",
        "/api/platform-academy/resources",
        "/api/platform-academy/interview-prep",
        "/api/platform-academy/activity/cache-control-user",
        "/api/progress/cache-control-user",
        "/api/users/cache-control-user/dashboard?domain=platform",
    ]
    for path in paths:
        response = client.get(path)
        assert response.status_code == 200, path
        assert_no_store_headers(response, path)


def test_courses_are_seeded():
    response = client.get("/api/courses")
    assert response.status_code == 200
    courses = response.json()
    assert len(courses) >= 5
    assert any(course["era"] == "Tang" for course in courses)


def test_platform_academy_catalog_roadmap_and_labs():
    catalog = client.get("/api/platform-academy/catalog")
    assert catalog.status_code == 200
    payload = catalog.json()
    assert payload["title"] == "Platform Academy"
    assert payload["total_courses"] >= 21
    assert payload["total_lessons"] >= 84
    assert {level["level_group"]: level["total_courses"] for level in payload["levels"]} == {
        "Fresher": 6,
        "Intermediate": 6,
        "Advanced": 9,
    }
    assert all(level["total_lessons"] >= 24 for level in payload["levels"])
    expected_categories = {
        "Kubernetes",
        "kubectl",
        "Cloud Native",
        "Docker",
        "Linux",
        "Networking",
        "EKS",
        "Helm",
        "ArgoCD",
        "Terraform",
        "AWS IAM",
        "AWS Operations",
        "Security",
        "SRE",
        "Observability",
        "Incident Response",
        "FinOps",
        "CI/CD",
        "Platform Engineering",
        "Career",
    }
    assert {track["course"]["category"] for track in payload["tracks"]} >= expected_categories
    assert {track["level_group"] for track in payload["tracks"]} == {"Fresher", "Intermediate", "Advanced"}
    kubernetes_track = next(track for track in payload["tracks"] if track["slug"] == "kubernetes-fundamentals")
    assert len(kubernetes_track["course"]["lessons"]) >= 4
    for slug in [
        "docker-image-supply-chain",
        "aws-operations-foundations",
        "observability-telemetry-engineering",
        "incident-response-reliability",
        "finops-kubernetes-aws",
        "career-job-search-sprint",
    ]:
        track = next(track for track in payload["tracks"] if track["slug"] == slug)
        assert len(track["course"]["lessons"]) == 4
    assert any("CrashLoopBackOff" in lab["title"] for lab in payload["labs"])
    assert {lab["level_group"] for lab in payload["labs"]} == {"Fresher", "Intermediate", "Advanced"}
    assert all(lab["lesson_id"] for lab in payload["labs"])

    roadmap = client.get("/api/platform-academy/roadmap")
    assert roadmap.status_code == 200
    stages = roadmap.json()["stages"]
    assert len(stages) >= 21
    assert stages[0]["title"] == "Linux Operator Foundations"
    assert stages[1]["title"] == "Networking Mental Model"
    assert stages[2]["title"] == "Kubernetes Object Mental Model"
    assert stages[-1]["title"] == "Platform Career Sprint"
    assert {stage["level_group"] for stage in stages} == {"Fresher", "Intermediate", "Advanced"}

    labs = client.get("/api/platform-academy/labs")
    assert labs.status_code == 200
    lab_payloads = labs.json()
    assert len(lab_payloads) == len(FULL_LAB_SLUGS)
    assert {lab["slug"] for lab in lab_payloads} == set(FULL_LAB_SLUGS)
    assert {lab["lab_tier"] for lab in lab_payloads} == {"full"}
    assert {lab["track"] for lab in lab_payloads} >= expected_categories
    portfolio_labs = [lab for lab in lab_payloads if lab["portfolio_grade"]]
    assert {lab["slug"] for lab in portfolio_labs} == PORTFOLIO_LAB_SLUGS
    assert all(lab["portfolio_focus"] for lab in portfolio_labs)
    trace_lab = next(lab for lab in lab_payloads if lab["slug"] == "trace-service-to-pod")
    assert trace_lab["lab_tier"] == "full"
    assert trace_lab["portfolio_grade"] is True
    assert trace_lab["portfolio_focus"] == "Kubernetes Service routing"
    assert trace_lab["setup_commands"]
    assert trace_lab["validation_commands"]
    assert trace_lab["cleanup_commands"] == ["bash labs/platform-academy/trace-service-to-pod/cleanup.sh"]
    assert trace_lab["workspace_archive_name"] == "trace-service-to-pod-learner-workspace.zip"
    assert trace_lab["workspace_root"] == "trace-service-to-pod"
    assert trace_lab["workspace_quickstart_commands"] == [
        "unzip trace-service-to-pod-learner-workspace.zip",
        "cd trace-service-to-pod",
        "./setup.sh",
        "# Fill evidence.md with your investigation notes",
        "./validate.sh --files-only",
        "./validate.sh",
        "./cleanup.sh",
    ]
    assert any("run-lab.sh setup trace-service-to-pod" in command for command in trace_lab["setup_commands"])
    assert any("labs/platform-academy/trace-service-to-pod/start.yaml" in command for command in trace_lab["setup_commands"])
    for lab in lab_payloads:
        assert lab["prerequisites"], lab["slug"]
        assert lab["setup_commands"], lab["slug"]
        assert any(f"run-lab.sh setup {lab['slug']}" in command for command in lab["setup_commands"]), lab["slug"]
        assert lab["practice_steps"], lab["slug"]
        assert lab["expected_evidence"], lab["slug"]
        assert lab["lab_tier"] in {"full", "guided", "evidence-pack"}
        assert isinstance(lab["portfolio_grade"], bool), lab["slug"]
        if lab["portfolio_grade"]:
            assert lab["portfolio_focus"], lab["slug"]
        assert lab["validation_commands"], lab["slug"]
        assert lab["cleanup_commands"], lab["slug"]
        assert lab["no_cluster_fallback"], lab["slug"]
        assert lab["artifact_paths"], lab["slug"]
        assert lab["learner_artifact_paths"], lab["slug"]
        assert lab["artifact_paths"] == lab["learner_artifact_paths"], lab["slug"]
        assert lab["workspace_archive_name"] == f"{lab['slug']}-learner-workspace.zip", lab["slug"]
        assert lab["workspace_root"] == lab["slug"], lab["slug"]
        assert lab["workspace_quickstart_commands"][0] == f"unzip {lab['slug']}-learner-workspace.zip", lab["slug"]
        assert lab["workspace_quickstart_commands"][1] == f"cd {lab['slug']}", lab["slug"]
        assert "./validate.sh --files-only" in lab["workspace_quickstart_commands"], lab["slug"]
        assert set(lab["artifact_paths"]).issubset(set(LAB_ARTIFACT_PATHS[lab["slug"]])), lab["slug"]
        assert not any(path.endswith("/solution.md") for path in lab["learner_artifact_paths"]), lab["slug"]
        assert not any(path.endswith("/README.md") for path in lab["learner_artifact_paths"]), lab["slug"]
        assert lab["worksheet_prompts"], lab["slug"]
        assert lab["rubric"], lab["slug"]
        assert lab["validation_checks"], lab["slug"]
        assert (REPO_ROOT / "labs/platform-academy" / lab["slug"]).is_dir(), lab["slug"]
        for artifact_path in lab["artifact_paths"]:
            assert (REPO_ROOT / artifact_path).is_file(), artifact_path

    resources = client.get("/api/platform-academy/resources")
    assert resources.status_code == 200
    resource_payload = resources.json()
    assert len(resource_payload["resources"]) >= 250
    assert len(resource_payload["domains"]) >= 14
    assert len(resource_payload["types"]) >= 16
    assert {item["domain"] for item in resource_payload["resources"]} >= expected_categories | {
        "Docker",
        "Incident Response",
        "FinOps",
        "Career",
    }
    must_have_types = {
        "cheatsheet",
        "runbook",
        "lab worksheet",
        "project brief",
        "interview prep",
        "official reference",
        "architecture diagram",
        "template",
        "assessment",
        "troubleshooting guide",
        "decision record",
        "production readiness checklist",
        "failure mode drill",
        "security review",
        "cost review",
        "portfolio artifact",
    }
    assert set(resource_payload["types"]) >= must_have_types
    assert all(resource["related_lessons"] or resource["related_labs"] for resource in resource_payload["resources"])
    assert all(resource["source_url"].startswith("https://") for resource in resource_payload["resources"])
    assert all(resource["source_label"] for resource in resource_payload["resources"])
    assert all(resource["official_sources"] for resource in resource_payload["resources"])
    assert all(resource["reviewed_at"] for resource in resource_payload["resources"])
    kubernetes_reference = next(
        resource for resource in resource_payload["resources"] if resource["slug"] == "kubernetes-official-reference"
    )
    assert kubernetes_reference["source_url"] == "https://kubernetes.io/docs/tasks/debug/"
    assert kubernetes_reference["source_label"] == "Kubernetes Debugging Tasks"


def test_platform_lab_bundle_download_contains_packet_and_artifacts():
    packet_response = client.get("/api/platform-academy/labs/trace-service-to-pod/packet")
    assert packet_response.status_code == 200
    assert packet_response.headers["content-type"].startswith("text/markdown")
    assert "trace-service-to-pod-lab-packet.md" in packet_response.headers["content-disposition"]
    assert_no_store_headers(packet_response, "lab packet")
    assert "# Trace Service traffic to ready Pods" in packet_response.text
    assert "## Guided run sequence" in packet_response.text
    assert "1. Prepare workspace" in packet_response.text
    assert "2. Investigate safely" in packet_response.text
    assert "3. Prove the finding" in packet_response.text
    assert "4. Reset or hand off" in packet_response.text
    assert "## Evidence artifact map" in packet_response.text
    assert "`labs/platform-academy/trace-service-to-pod/validate.sh` - Self-check script" in packet_response.text
    assert "## Learner artifact paths" in packet_response.text
    assert "labs/platform-academy/trace-service-to-pod/start.yaml" in packet_response.text
    assert "labs/platform-academy/trace-service-to-pod/solution.md" not in packet_response.text
    assert "labs/platform-academy/trace-service-to-pod/README.md" not in packet_response.text
    assert "## Worksheet prompts" in packet_response.text
    assert "## Local workspace" in packet_response.text
    assert "run-lab.sh workspace trace-service-to-pod" in packet_response.text
    assert "## Downloaded workspace quickstart" in packet_response.text
    assert "unzip trace-service-to-pod-learner-workspace.zip" in packet_response.text
    assert "cd trace-service-to-pod" in packet_response.text
    assert "./validate.sh --files-only" in packet_response.text
    assert "## Validation checks" in packet_response.text
    assert "## Rubric" in packet_response.text

    response = client.get("/api/platform-academy/labs/trace-service-to-pod/bundle")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"
    assert "trace-service-to-pod-lab-bundle.zip" in response.headers["content-disposition"]
    assert_no_store_headers(response, "instructor source bundle")

    with ZipFile(BytesIO(response.content)) as archive:
        names = set(archive.namelist())
        assert "trace-service-to-pod/README.md" in names
        assert "trace-service-to-pod/labs/platform-academy/trace-service-to-pod/start.yaml" in names
        packet = archive.read("trace-service-to-pod/README.md").decode()
        assert "Guided run sequence" in packet
        assert "Evidence artifact map" in packet
        assert "Worksheet" in packet
        assert "Rubric" in packet
        assert packet == packet_response.text
        assert "trace-service-to-pod/labs/platform-academy/trace-service-to-pod/validate.sh" in names
        assert "trace-service-to-pod/labs/platform-academy/trace-service-to-pod/solution.md" in names

    workspace_response = client.get("/api/platform-academy/labs/trace-service-to-pod/workspace-bundle")
    assert workspace_response.status_code == 200
    assert workspace_response.headers["content-type"] == "application/zip"
    assert "trace-service-to-pod-learner-workspace.zip" in workspace_response.headers["content-disposition"]
    assert_no_store_headers(workspace_response, "learner workspace bundle")

    with ZipFile(BytesIO(workspace_response.content)) as archive:
        names = set(archive.namelist())
        assert "trace-service-to-pod/README.md" in names
        assert "trace-service-to-pod/evidence.md" in names
        assert "trace-service-to-pod/MANIFEST.txt" in names
        assert "trace-service-to-pod/setup.sh" in names
        assert "trace-service-to-pod/validate.sh" in names
        assert "trace-service-to-pod/cleanup.sh" in names
        assert "trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/start.yaml" in names
        assert "trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/validate.sh" in names
        assert "trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/README.md" not in names
        assert "trace-service-to-pod/artifacts/labs/platform-academy/trace-service-to-pod/solution.md" not in names
        assert archive.getinfo("trace-service-to-pod/validate.sh").external_attr >> 16 & 0o111
        manifest = archive.read("trace-service-to-pod/MANIFEST.txt").decode()
        assert "Withheld source-only artifacts" in manifest
        assert "- labs/platform-academy/trace-service-to-pod/README.md" in manifest
        assert "- labs/platform-academy/trace-service-to-pod/solution.md" in manifest
        assert "./validate.sh --files-only" in manifest
        workspace_readme = archive.read("trace-service-to-pod/README.md").decode()
        assert "## Downloaded workspace quickstart" not in workspace_readme


def test_platform_source_bundle_requires_token_outside_local():
    original_environment = settings.environment
    original_public = settings.platform_source_bundle_public
    original_token = settings.platform_source_bundle_token
    try:
        settings.environment = "preview"
        settings.platform_source_bundle_public = False
        settings.platform_source_bundle_token = None

        blocked = client.get("/api/platform-academy/labs/trace-service-to-pod/bundle")
        assert blocked.status_code == 403
        assert blocked.json()["detail"] == "source bundle requires an instructor token"
        assert_no_store_headers(blocked, "blocked instructor source bundle")

        settings.platform_source_bundle_token = "source-bundle-secret"
        assert client.get("/api/platform-academy/labs/trace-service-to-pod/bundle").status_code == 403
        assert (
            client.get(
                "/api/platform-academy/labs/trace-service-to-pod/bundle",
                headers={"X-Platform-Source-Bundle-Token": "wrong"},
            ).status_code
            == 403
        )
        allowed = client.get(
            "/api/platform-academy/labs/trace-service-to-pod/bundle",
            headers={"X-Platform-Source-Bundle-Token": "source-bundle-secret"},
        )
        assert allowed.status_code == 200
        assert allowed.headers["content-type"] == "application/zip"
        assert_no_store_headers(allowed, "token-authenticated instructor source bundle")

        settings.platform_source_bundle_public = True
        settings.platform_source_bundle_token = None
        still_blocked = client.get("/api/platform-academy/labs/trace-service-to-pod/bundle")
        assert still_blocked.status_code == 403
        assert_no_store_headers(still_blocked, "non-local public source bundle flag")

        settings.environment = "local"
        local_public_response = client.get("/api/platform-academy/labs/trace-service-to-pod/bundle")
        assert local_public_response.status_code == 200
        assert_no_store_headers(local_public_response, "local public instructor source bundle")
    finally:
        settings.environment = original_environment
        settings.platform_source_bundle_public = original_public
        settings.platform_source_bundle_token = original_token


def test_practical_platform_labs_expose_specific_evidence_guides():
    response = client.get("/api/platform-academy/labs")
    assert response.status_code == 200
    labs = {lab["slug"]: lab for lab in response.json()}
    deepened_labs = {
        "trace-service-to-pod": {
            "artifacts": {"broken-evidence.txt", "evidence-template.md"},
            "terms": {"Service selector", "Pod label", "EndpointSlice", "source-manifest"},
        },
        "debug-crashloop-imagepull": {
            "artifacts": {"broken-evidence.txt", "evidence-template.md"},
            "terms": {"CrashLoopBackOff", "ImagePullBackOff", "registry", "previous"},
        },
        "review-yaml-before-apply": {
            "artifacts": {"evidence-template.md"},
            "terms": {"ClusterRole", "privileged: true", "hostPath", "stringData.token"},
        },
        "inspect-linux-failure-evidence": {
            "artifacts": {"evidence-template.md"},
            "terms": {"CrashLoopBackOff", "exit code 126", "uid=10001(checkout)", "running as root"},
        },
        "trace-network-path": {
            "artifacts": {"incident-handoff.md", "evidence-template.md"},
            "terms": {"incident handoff", "HTTP/2 503", "Target.ResponseCodeMismatch", "targetPort web", "targetPort: http"},
        },
        "debug-aws-alb-health-path": {
            "artifacts": {"evidence-template.md"},
            "terms": {"ALB", "Target.ResponseCodeMismatch", "targetPort", "owner"},
        },
        "diagnose-eks-ip-exhaustion": {
            "artifacts": {"evidence-template.md"},
            "terms": {"FailedScheduling", "FailedCreatePodSandBox", "subnet-bbb222", "prefix delegation disabled"},
        },
        "design-production-eks-review": {
            "artifacts": {"evidence-template.md"},
            "terms": {"endpoint posture", "missing PDB", "zonal storage", "FinOps"},
        },
        "review-terraform-eks-plan": {
            "artifacts": {"evidence-template.md"},
            "terms": {"terraform apply", "node group replacement", "0.0.0.0/0", "eks:*"},
        },
        "debug-irsa-access-denied": {
            "artifacts": {"workload-error.log", "evidence-template.md"},
            "terms": {"ServiceAccount", "AWS_ROLE_ARN", "AccessDenied", "s3:PutObject", "least-privilege"},
        },
        "audit-tenant-boundaries": {
            "artifacts": {"evidence-template.md"},
            "terms": {"cluster-admin", "restricted", "allow-all-egress", "Blocks onboarding"},
        },
        "validate-helm-release-artifact": {
            "artifacts": {"evidence-template.md"},
            "terms": {"immutable", "checkout:latest", "privileged", "LoadBalancer"},
        },
        "trace-argocd-drift": {
            "artifacts": {"argocd-app-report.txt", "evidence-template.md"},
            "terms": {"ArgoCD report", "selfHeal", "replicas: 3", "replicas: 9", "/spec/replicas", "Git-owned"},
        },
        "review-docker-image-supply-chain": {
            "artifacts": {"evidence-template.md"},
            "terms": {"checkout:latest", "RepoDigests", "API_TOKEN", "SBOM"},
        },
        "design-safe-release-pipeline": {
            "artifacts": {"evidence-template.md"},
            "terms": {"deploy-prod", "github.ref == 'refs/heads/main'", "image-digest.txt", "rollback-if-slo-breach"},
        },
        "create-platform-golden-path": {
            "artifacts": {"evidence-template.md"},
            "terms": {"required inputs", "missing SLO dashboard", "adoption metrics", "readiness gates"},
        },
        "write-slo-backed-runbook": {
            "artifacts": {"evidence-template.md"},
            "terms": {"CheckoutHighErrorBudgetBurn", "99.9%", "2% 5xx", "revision 43"},
        },
        "design-opentelemetry-signal-path": {
            "artifacts": {"evidence-template.md"},
            "terms": {"http.request.header.authorization", "trace_id=missing", "customer_email", "owner map"},
        },
        "run-incident-commander-tabletop": {
            "artifacts": {"evidence-template.md"},
            "terms": {"SEV-2", "0.2% to 9.4%", "revision 42", "Communications lead"},
        },
        "audit-eks-cost-drivers": {
            "artifacts": {"evidence-template.md"},
            "terms": {"over-requested", "abandoned LoadBalancer", "expected savings", "review cadence"},
        },
        "build-platform-career-proof-pack": {
            "artifacts": {"evidence-template.md"},
            "terms": {"public-safe", "repeated target skills", "incident response", "release safety"},
        },
    }

    for slug, expected in deepened_labs.items():
        lab = labs[slug]
        artifact_paths = set(lab["artifact_paths"])
        for artifact_name in expected["artifacts"]:
            assert f"labs/platform-academy/{slug}/{artifact_name}" in artifact_paths
        assert len(lab["worksheet_prompts"]) >= 6
        assert len(lab["rubric"]) >= 6
        assert len(lab["validation_checks"]) >= 7
        searchable = "\n".join(lab["worksheet_prompts"] + lab["rubric"] + lab["validation_checks"])
        for term in expected["terms"]:
            assert term in searchable


def test_flagship_platform_labs_advertise_evidence_note_self_checks():
    response = client.get("/api/platform-academy/labs")
    assert response.status_code == 200
    labs = {lab["slug"]: lab for lab in response.json()}
    evidence_self_check_labs = {
        "trace-service-to-pod": "/tmp/trace-service-evidence.md",
        "debug-crashloop-imagepull": "/tmp/crashloop-imagepull-evidence.md",
        "review-yaml-before-apply": "/tmp/yaml-review-evidence.md",
        "diagnose-eks-ip-exhaustion": "/tmp/eks-ip-exhaustion-evidence.md",
        "validate-helm-release-artifact": "/tmp/helm-release-evidence.md",
        "trace-argocd-drift": "/tmp/argocd-drift-evidence.md",
        "design-production-eks-review": "/tmp/production-eks-review-evidence.md",
        "audit-tenant-boundaries": "/tmp/tenant-boundaries-evidence.md",
        "trace-network-path": "/tmp/network-path-evidence.md",
        "debug-aws-alb-health-path": "/tmp/alb-health-path-evidence.md",
        "review-terraform-eks-plan": "/tmp/terraform-eks-plan-evidence.md",
        "design-safe-release-pipeline": "/tmp/release-pipeline-evidence.md",
        "create-platform-golden-path": "/tmp/golden-path-evidence.md",
        "review-docker-image-supply-chain": "/tmp/docker-supply-chain-evidence.md",
        "write-slo-backed-runbook": "/tmp/slo-runbook-evidence.md",
        "inspect-linux-failure-evidence": "/tmp/linux-failure-evidence.md",
        "debug-irsa-access-denied": "/tmp/irsa-access-denied-evidence.md",
        "design-opentelemetry-signal-path": "/tmp/otel-signal-path-evidence.md",
        "run-incident-commander-tabletop": "/tmp/incident-commander-evidence.md",
        "audit-eks-cost-drivers": "/tmp/eks-cost-evidence.md",
        "build-platform-career-proof-pack": "/tmp/career-proof-evidence.md",
    }

    for slug, evidence_path in evidence_self_check_labs.items():
        lab = labs[slug]
        assert "labs/platform-academy/lib/evidence-check.sh" in lab["artifact_paths"]
        assert any(command.endswith(f"--evidence {evidence_path}") for command in lab["validation_commands"])


def test_all_platform_lab_bundles_include_advertised_artifacts(tmp_path):
    labs_response = client.get("/api/platform-academy/labs")
    assert labs_response.status_code == 200

    for lab in labs_response.json():
        slug = lab["slug"]
        response = client.get(f"/api/platform-academy/labs/{slug}/bundle")
        assert response.status_code == 200, slug
        assert response.headers["content-type"] == "application/zip"
        assert f"{slug}-lab-bundle.zip" in response.headers["content-disposition"]

        with ZipFile(BytesIO(response.content)) as archive:
            name_list = archive.namelist()
            names = set(name_list)
            assert len(name_list) == len(names), f"{slug} bundle has duplicate entries"
            extract_root = (tmp_path / slug).resolve()
            extract_root.mkdir(parents=True)
            for member in archive.infolist():
                assert member.filename.startswith(f"{slug}/"), member.filename
                target = (extract_root / member.filename).resolve()
                assert target.is_relative_to(extract_root), member.filename
            manifest = archive.read(f"{slug}/SOURCE-MANIFEST.txt").decode()
            source_artifacts = LAB_ARTIFACT_PATHS[slug]
            required = {f"{slug}/README.md", f"{slug}/SOURCE-MANIFEST.txt"} | {
                f"{slug}/{artifact_path}" for artifact_path in source_artifacts
            }
            missing = sorted(required - names)
            assert not missing, f"{slug} missing bundle entries: {missing}"
            empty = sorted(name for name in required if archive.getinfo(name).file_size == 0)
            assert not empty, f"{slug} empty bundle entries: {empty}"
            for artifact_path in source_artifacts:
                assert f"- {artifact_path}" in manifest
            assert f"- labs/platform-academy/{slug}/README.md" in manifest
            assert f"- labs/platform-academy/{slug}/solution.md" in manifest

            for script_name in ["validate.sh", "cleanup.sh"]:
                member = f"{slug}/labs/platform-academy/{slug}/{script_name}"
                mode = archive.getinfo(member).external_attr >> 16
                assert mode & 0o111, f"{member} is not executable"


def test_all_platform_lab_workspace_bundles_withhold_solutions():
    labs_response = client.get("/api/platform-academy/labs")
    assert labs_response.status_code == 200

    for lab in labs_response.json():
        slug = lab["slug"]
        response = client.get(f"/api/platform-academy/labs/{slug}/workspace-bundle")
        assert response.status_code == 200, slug
        assert response.headers["content-type"] == "application/zip"
        assert f"{slug}-learner-workspace.zip" in response.headers["content-disposition"]

        with ZipFile(BytesIO(response.content)) as archive:
            names = set(archive.namelist())
            assert f"{slug}/README.md" in names
            assert f"{slug}/evidence.md" in names
            assert f"{slug}/MANIFEST.txt" in names
            for script_name in ["setup.sh", "validate.sh", "cleanup.sh"]:
                member = f"{slug}/{script_name}"
                assert member in names
                assert archive.getinfo(member).external_attr >> 16 & 0o111, f"{member} is not executable"
            assert f"{slug}/artifacts/labs/platform-academy/{slug}/solution.md" not in names
            assert all(not name.endswith("/solution.md") for name in names)
            assert f"{slug}/artifacts/labs/platform-academy/{slug}/README.md" not in names
            for artifact_path in lab["learner_artifact_paths"]:
                assert f"{slug}/artifacts/{artifact_path}" in names
            manifest = archive.read(f"{slug}/MANIFEST.txt").decode()
            readme = archive.read(f"{slug}/README.md").decode()
            assert "Withheld source-only artifacts" in manifest
            assert f"- labs/platform-academy/{slug}/README.md" in manifest
            assert f"- labs/platform-academy/{slug}/solution.md" in manifest
            assert "## Run from extracted bundle" in readme
            assert f"artifacts/labs/platform-academy/{slug}/" in readme
            assert "./setup.sh" in manifest
            assert "./validate.sh --files-only" in manifest
            assert "./cleanup.sh" in manifest


def test_platform_lab_workspace_bundles_extract_to_runnable_file_checks(tmp_path):
    setup_smoke_expectations = {
        "trace-service-to-pod": "Service routing analysis passed",
        "debug-crashloop-imagepull": "CrashLoop/ImagePull analysis passed",
        "review-yaml-before-apply": "YAML manifest risk analysis passed",
    }

    for slug in FULL_LAB_SLUGS:
        response = client.get(f"/api/platform-academy/labs/{slug}/workspace-bundle")
        assert response.status_code == 200

        extract_root = tmp_path / slug
        with ZipFile(BytesIO(response.content)) as archive:
            archive.extractall(extract_root)

        workspace = extract_root / slug
        subprocess.run(["bash", "-n", str(workspace / "setup.sh")], check=True)
        subprocess.run(["bash", "-n", str(workspace / "validate.sh")], check=True)
        subprocess.run(["bash", "-n", str(workspace / "cleanup.sh")], check=True)
        if slug in setup_smoke_expectations:
            setup_result = subprocess.run(
                ["bash", str(workspace / "setup.sh")],
                cwd=workspace,
                check=True,
                capture_output=True,
                text=True,
            )
            assert setup_smoke_expectations[slug] in setup_result.stdout
            assert str(workspace / "evidence.md") in setup_result.stdout
        result = subprocess.run(
            ["bash", str(workspace / "validate.sh"), "--files-only"],
            cwd=workspace,
            check=True,
            capture_output=True,
            text=True,
        )
        assert f"File checks passed for {slug}" in result.stdout


def test_full_platform_labs_include_guides_solutions_and_validators():
    response = client.get("/api/platform-academy/labs")
    assert response.status_code == 200
    labs = {lab["slug"]: lab for lab in response.json()}
    assert set(labs) == set(FULL_LAB_SLUGS)

    for slug in FULL_LAB_SLUGS:
        lab = labs[slug]
        assert lab["lab_tier"] == "full"
        artifact_paths = set(LAB_ARTIFACT_PATHS[slug])
        lab_dir = REPO_ROOT / "labs/platform-academy" / slug
        for filename in ["README.md", "solution.md", "validate.sh", "cleanup.sh"]:
            path = lab_dir / filename
            assert path.is_file(), path
            assert str(path.relative_to(REPO_ROOT)) in artifact_paths
        assert any("validate.sh" in command for command in lab["validation_commands"])
        assert any("cleanup.sh" in command for command in lab["cleanup_commands"])
        subprocess.run(["bash", str(lab_dir / "validate.sh")], check=True, capture_output=True, text=True)


def test_full_platform_lab_verification_harness_runs():
    subprocess.run(
        ["bash", str(REPO_ROOT / "labs/platform-academy/verify-full-labs.sh")],
        check=True,
        capture_output=True,
        text=True,
    )


def test_platform_lab_submission_persists_workbook_state():
    user_id = "lab-submission-user"
    lab_slug = "trace-service-to-pod"

    initial = client.get(f"/api/platform-academy/labs/{lab_slug}/submission/{user_id}")
    assert initial.status_code == 200
    initial_payload = initial.json()
    assert initial_payload["score"] == 0
    assert initial_payload["completed_checks"] == 0
    assert initial_payload["total_prompts"] >= 1
    assert initial_payload["total_checks"] >= initial_payload["total_prompts"]

    response = client.post(
        f"/api/platform-academy/labs/{lab_slug}/submission",
        json={
            "user_id": user_id,
            "worksheet_answers": {"worksheet-0": "Service selector is app=checkout but Pods use app=checkout-api."},
            "checked_items": {"worksheet-0": True, "validation-0": True},
            "status": "in_progress",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["lab_slug"] == lab_slug
    assert payload["answered_prompts"] == 1
    assert payload["completed_checks"] == 2
    assert payload["score"] > 0
    assert payload["evidence_terms"]
    assert {item["status"] for item in payload["rubric_feedback"]} & {"passes", "strong"}
    assert any("selector" in item["evidence_terms"] for item in payload["rubric_feedback"])
    assert "solution.md" not in payload["evidence_terms"]
    assert "readme.md" not in payload["evidence_terms"]

    answer_key_probe = client.post(
        f"/api/platform-academy/labs/{lab_slug}/submission",
        json={
            "user_id": f"{user_id}-answer-key-probe",
            "worksheet_answers": {"worksheet-0": "I opened README.md and solution.md."},
            "checked_items": {"worksheet-0": True},
            "status": "in_progress",
        },
    )
    assert answer_key_probe.status_code == 200
    answer_key_payload = answer_key_probe.json()
    assert "solution.md" not in answer_key_payload["evidence_terms"]
    assert "readme.md" not in answer_key_payload["evidence_terms"]
    assert all(
        "solution.md" not in item["evidence_terms"] and "readme.md" not in item["evidence_terms"]
        for item in answer_key_payload["rubric_feedback"]
    )

    fetched = client.get(f"/api/platform-academy/labs/{lab_slug}/submission/{user_id}")
    assert fetched.status_code == 200
    assert fetched.json()["worksheet_answers"] == payload["worksheet_answers"]
    assert fetched.json()["checked_items"] == payload["checked_items"]

    submissions = client.get(f"/api/platform-academy/lab-submissions/{user_id}")
    assert submissions.status_code == 200
    assert [submission["lab_slug"] for submission in submissions.json()] == [lab_slug]
    assert submissions.json()[0]["rubric_feedback"] == payload["rubric_feedback"]


def test_deepened_platform_lab_feedback_uses_criterion_specific_evidence():
    user_id = "lab-rubric-specific-user"
    checked_items = {f"worksheet-{index}": True for index in range(6)}
    checked_items.update({f"validation-{index}": True for index in range(7)})

    response = client.post(
        "/api/platform-academy/labs/debug-crashloop-imagepull/submission",
        json={
            "user_id": user_id,
            "worksheet_answers": {
                "worksheet-0": "payments-debug no-cluster transcript used, cleanup documented, local context not mutated.",
                "worksheet-1": "checkout-crash is CrashLoopBackOff and started; checkout-pull is ImagePullBackOff and never started.",
                "worksheet-2": "Last State terminated, exit code 42, logs --previous / previous logs show missing DB_URL.",
                "worksheet-3": "registry.invalid.example/checkout:missing causes ErrImagePull/ImagePullBackOff events from the registry.",
                "worksheet-4": "app/config owner fixes DB_URL; image/registry owner fixes the tag or registry; rollback if needed.",
                "worksheet-5": "rollout validation passed for both Deployments, validate output saved, cleanup or fallback recorded.",
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    assert len(feedback) == 6
    previous_log_feedback = next(item for item in feedback if "logs --previous" in item["criterion"])
    registry_feedback = next(item for item in feedback if "invalid registry reference" in item["criterion"])
    validation_feedback = next(item for item in feedback if "Validates both fixed Deployments" in item["criterion"])
    assert previous_log_feedback["status"] == "strong"
    assert "missing db-url" in previous_log_feedback["evidence_terms"]
    assert registry_feedback["status"] == "strong"
    assert "registry.invalid.example/checkout:missing" in registry_feedback["evidence_terms"]
    assert validation_feedback["status"] == "strong"


def test_deepened_platform_lab_feedback_flags_missing_specific_evidence():
    response = client.post(
        "/api/platform-academy/labs/trace-service-to-pod/submission",
        json={
            "user_id": "lab-rubric-missing-specific-user",
            "worksheet_answers": {
                "worksheet-1": "The Service seems wrong, but I have not copied the selector yet.",
            },
            "checked_items": {"worksheet-1": True},
            "status": "in_progress",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    selector_feedback = next(item for item in feedback if "app=checkout" in item["criterion"])
    pod_label_feedback = next(item for item in feedback if "app=checkout-api" in item["criterion"])
    assert selector_feedback["status"] == "needs-evidence"
    assert "app=checkout" not in selector_feedback["evidence_terms"]
    assert "app=checkout" in selector_feedback["feedback"]
    assert pod_label_feedback["status"] == "missing"


def test_security_lab_feedback_separates_identity_trust_and_permission():
    checked_items = {f"worksheet-{index}": True for index in range(7)}
    checked_items.update({f"validation-{index}": True for index in range(8)})

    response = client.post(
        "/api/platform-academy/labs/debug-irsa-access-denied/submission",
        json={
            "user_id": "lab-irsa-rubric-user",
            "worksheet_answers": {
                "worksheet-0": "captured evidence only, no live IAM changes; ServiceAccount payments checkout uses role ARN.",
                "worksheet-1": "payments/checkout serviceAccountName checkout has role-arn and AWS_ROLE_ARN payments-checkout-readonly.",
                "worksheet-2": "workload-error.log shows botocore SDK AccessDenied for PutObject.",
                "worksheet-3": (
                    "trust policy has system:serviceaccount:default:checkout but expected "
                    "system:serviceaccount:payments:checkout, a namespace mismatch."
                ),
                "worksheet-4": "CloudTrail AccessDenied for PutObject to payments-prod-receipts receipts/2026/05/30/example.json.",
                "worksheet-5": "trust owner and permission owner are separate; avoid wildcard s3:* fixes.",
                "worksheet-6": (
                    "Use s3:PutObject on arn:aws:s3:::payments-prod-receipts/receipts/* "
                    "with least-privilege validation and handoff."
                ),
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    trust_feedback = next(item for item in feedback if "trust subject mismatch" in item["criterion"])
    permission_feedback = next(item for item in feedback if "application SDK" in item["criterion"])
    cloudtrail_feedback = next(item for item in feedback if "bucket and key-prefix" in item["criterion"])
    fix_feedback = next(item for item in feedback if "least-privilege permission scope" in item["criterion"])
    assert trust_feedback["status"] == "strong"
    assert "system:serviceaccount:payments:checkout" in trust_feedback["evidence_terms"]
    assert permission_feedback["status"] == "strong"
    assert "workload-error.log" in permission_feedback["evidence_terms"]
    assert cloudtrail_feedback["status"] == "strong"
    assert "payments-prod-receipts" in cloudtrail_feedback["evidence_terms"]
    assert fix_feedback["status"] == "strong"


def test_delivery_lab_feedback_blocks_tag_only_image_promotion():
    checked_items = {f"worksheet-{index}": True for index in range(6)}
    checked_items.update({f"validation-{index}": True for index in range(7)})

    response = client.post(
        "/api/platform-academy/labs/review-docker-image-supply-chain/submission",
        json={
            "user_id": "lab-docker-rubric-user",
            "worksheet_answers": {
                "worksheet-0": "Reviewed Dockerfile, image-inspect.json, and history.txt; secret pattern will not be reused.",
                "worksheet-1": "RepoTags show checkout:latest, RepoDigests is empty, and rollback digest is missing.",
                "worksheet-2": "API_TOKEN=do-not-bake-secrets appears in Dockerfile, image config, and history; User is blank.",
                "worksheet-3": "COPY --from=build /app . copies source tree into runtime on node:22, effectively root runtime risk.",
                "worksheet-4": "Block promotion until digest, SBOM, scan, non-root runtime, and owner actions are complete.",
                "worksheet-5": "promotion-note.md plus validate output records rollback digest and cleanup/no-runtime evidence.",
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    digest_feedback = next(item for item in feedback if "missing RepoDigests" in item["criterion"])
    secret_feedback = next(item for item in feedback if "secret leakage" in item["criterion"])
    promotion_feedback = next(item for item in feedback if "Blocks promotion" in item["criterion"])
    assert digest_feedback["status"] == "strong"
    assert "repodigests" in digest_feedback["evidence_terms"]
    assert secret_feedback["status"] == "strong"
    assert "api-token=do-not-bake-secrets" in secret_feedback["evidence_terms"]
    assert promotion_feedback["status"] == "strong"


def test_sre_lab_feedback_tracks_slo_evidence_and_owner_split():
    checked_items = {f"worksheet-{index}": True for index in range(6)}
    checked_items.update({f"validation-{index}": True for index in range(7)})

    response = client.post(
        "/api/platform-academy/labs/write-slo-backed-runbook/submission",
        json={
            "user_id": "lab-slo-rubric-user",
            "worksheet_answers": {
                "worksheet-0": "signals.md reviewed for CheckoutHighErrorBudgetBurn; no live rollback was run.",
                "worksheet-1": "99.9% SLO, CheckoutHighErrorBudgetBurn, 2% 5xx threshold, 14 minutes, dashboard impact.",
                "worksheet-2": (
                    "revision 43 rollout correlates with readiness flapping and target group unhealthy; check dependency traces."
                ),
                "worksheet-3": "Run kubectl rollout history as read-only evidence before rollback, traffic shift, or escalation.",
                "worksheet-4": "Incident commander, App owner, Platform owner, and SRE owner validate and follow up.",
                "worksheet-5": "completed-runbook.md, incident-decision.md, validate output, dashboard, and cleanup note saved.",
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    alert_feedback = next(item for item in feedback if "2% 5xx threshold" in item["criterion"])
    rollout_feedback = next(item for item in feedback if "revision 43" in item["criterion"])
    owner_feedback = next(item for item in feedback if "Incident commander" in item["criterion"])
    assert alert_feedback["status"] == "strong"
    assert "checkouthigherrorbudgetburn" in alert_feedback["evidence_terms"]
    assert rollout_feedback["status"] == "strong"
    assert "revision 43" in rollout_feedback["evidence_terms"]
    assert owner_feedback["status"] == "strong"


def test_network_lab_feedback_tracks_hop_and_owner_evidence():
    checked_items = {f"worksheet-{index}": True for index in range(6)}
    checked_items.update({f"validation-{index}": True for index in range(7)})

    response = client.post(
        "/api/platform-academy/labs/trace-network-path/submission",
        json={
            "user_id": "lab-network-rubric-user",
            "worksheet_answers": {
                "worksheet-0": (
                    "incident-handoff.md Pager Snapshot impact and network-evidence.md for checkout.example.com/healthz; "
                    "no live DNS or ALB change."
                ),
                "worksheet-1": "HTTP/2 503 from awselb/2.0 with DNS target k8s-payments-checkout-123456.",
                "worksheet-2": "ALB target health shows Target.ResponseCodeMismatch and unhealthy target.",
                "worksheet-3": "Ingress Service targetPort web and targetPort: web mismatch Pod port http.",
                "worksheet-4": (
                    "DNS owner and ALB owner are ruled out; app/platform owner uses source-manifest "
                    "fixed-ingress-service.yaml targetPort: http."
                ),
                "worksheet-5": "diff, validate, cleanup, no-cluster evidence-template.md saved.",
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    alb_feedback = next(item for item in feedback if "Target.ResponseCodeMismatch" in item["criterion"])
    port_feedback = next(item for item in feedback if "targetPort web" in item["criterion"])
    fix_feedback = next(item for item in feedback if "targetPort: http" in item["criterion"])
    assert alb_feedback["status"] == "strong"
    assert "target.responsecodemismatch" in alb_feedback["evidence_terms"]
    assert port_feedback["status"] == "strong"
    assert fix_feedback["status"] == "strong"


def test_yaml_review_lab_feedback_tracks_security_blockers():
    checked_items = {f"worksheet-{index}": True for index in range(6)}
    checked_items.update({f"validation-{index}": True for index in range(7)})

    response = client.post(
        "/api/platform-academy/labs/review-yaml-before-apply/submission",
        json={
            "user_id": "lab-yaml-rubric-user",
            "worksheet_answers": {
                "worksheet-0": "Reviewed vendor.yaml with no live apply against any shared cluster.",
                "worksheet-1": "Inventory includes ClusterRole, Namespace, Deployment, Secret, and dry-run parse-check output.",
                "worksheet-2": (
                    'Blockers: resources: ["pods", "secrets"], privileged: true, hostPath, and stringData.token.'
                ),
                "worksheet-3": "Classified as RBAC, workload security, node filesystem, and credential handling.",
                "worksheet-4": "Block until safe-baseline.yaml, vendor questions, and allowPrivilegeEscalation: false are addressed.",
                "worksheet-5": "diff, validate, cleanup, evidence-template.md, and no-live-apply note saved.",
            },
            "checked_items": checked_items,
            "status": "submitted",
        },
    )

    assert response.status_code == 200
    feedback = response.json()["rubric_feedback"]
    blocker_feedback = next(item for item in feedback if "privileged: true" in item["criterion"])
    category_feedback = next(item for item in feedback if "credential handling" in item["criterion"])
    decision_feedback = next(item for item in feedback if "vendor questions" in item["criterion"])
    assert blocker_feedback["status"] == "strong"
    assert "privileged: true" in blocker_feedback["evidence_terms"]
    assert "hostpath" in blocker_feedback["evidence_terms"]
    assert category_feedback["status"] == "strong"
    assert decision_feedback["status"] == "strong"


def test_platform_lab_submission_ignores_unknown_checked_items_for_scoring():
    user_id = "lab-submission-extra-checks-user"
    lab_slug = "trace-service-to-pod"
    extra_checked_items = {f"not-a-real-check-{index}": True for index in range(25)}

    response = client.post(
        f"/api/platform-academy/labs/{lab_slug}/submission",
        json={
            "user_id": user_id,
            "worksheet_answers": {"worksheet-0": "Service selector mismatch evidence."},
            "checked_items": extra_checked_items,
            "status": "submitted",
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["checked_items"] == extra_checked_items
    assert payload["completed_checks"] == 0
    assert payload["answered_prompts"] == 1
    assert payload["score"] == round(1 / (payload["total_checks"] + payload["total_prompts"]) * 100, 2)
    assert payload["score"] <= 100


def test_platform_lab_submission_initial_get_is_concurrency_safe():
    user_id = "lab-submission-concurrency-user"
    lab_slug = "trace-service-to-pod"

    def fetch_submission():
        return client.get(f"/api/platform-academy/labs/{lab_slug}/submission/{user_id}")

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: fetch_submission(), range(8)))

    assert all(response.status_code == 200 for response in responses)
    assert {response.json()["id"] for response in responses}
    assert len({response.json()["id"] for response in responses}) == 1

    submissions = client.get(f"/api/platform-academy/lab-submissions/{user_id}")
    assert submissions.status_code == 200
    assert [submission["lab_slug"] for submission in submissions.json()] == [lab_slug]


def test_platform_lab_submission_rejects_unknown_lab():
    response = client.get("/api/platform-academy/labs/not-a-lab/submission/demo-user")
    assert response.status_code == 404


def test_platform_learner_state_export_import_round_trips_guest_progress():
    source_user_id = "platform-export-source"
    target_user_id = "platform-export-target"
    all_courses = client.get("/api/courses").json()
    platform_courses = client.get("/api/courses?domain=platform").json()
    platform_lesson_id = platform_courses[0]["lessons"][0]["id"]
    legacy_lesson_id = next(course for course in all_courses if course["era"] != "Platform Academy")["lessons"][0]["id"]
    lab_slug = "trace-service-to-pod"

    assert client.post(
        "/api/progress",
        json={"user_id": source_user_id, "lesson_id": platform_lesson_id, "completed": True, "score": 1},
    ).status_code == 200
    assert client.post(
        "/api/progress",
        json={"user_id": source_user_id, "lesson_id": legacy_lesson_id, "completed": True, "score": 1},
    ).status_code == 200
    assert (
        client.post(
            "/api/platform-academy/activity",
            json={
                "user_id": source_user_id,
                "target_type": "resource",
                "target_id": "kubernetes-debugging-cheatsheet",
                "state": "completed",
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/platform-academy/labs/{lab_slug}/submission",
            json={
                "user_id": source_user_id,
                "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            },
        ).status_code
        == 200
    )

    exported = client.get(f"/api/platform-academy/state/{source_user_id}/export")
    assert exported.status_code == 200
    state = exported.json()
    assert state["schema_version"] == 1
    assert state["source_user_id"] == source_user_id
    assert [row["lesson_id"] for row in state["progress"]] == [platform_lesson_id]
    assert state["activity"][0]["target_id"] == "kubernetes-debugging-cheatsheet"
    assert state["lab_submissions"][0]["lab_slug"] == lab_slug

    imported = client.post("/api/platform-academy/state/import", json={"target_user_id": target_user_id, "state": state})
    assert imported.status_code == 200
    assert imported.json() == {
        "user_id": target_user_id,
        "progress_imported": 1,
        "activity_imported": 1,
        "lab_submissions_imported": 1,
    }

    target_progress = client.get(f"/api/progress/{target_user_id}")
    assert any(row["lesson_id"] == platform_lesson_id and row["completed"] for row in target_progress.json())
    assert all(row["lesson_id"] != legacy_lesson_id for row in target_progress.json())
    target_activity = client.get(f"/api/platform-academy/activity/{target_user_id}")
    assert target_activity.json()[0]["target_id"] == "kubernetes-debugging-cheatsheet"
    target_submissions = client.get(f"/api/platform-academy/lab-submissions/{target_user_id}")
    assert target_submissions.json()[0]["lab_slug"] == lab_slug
    target_dashboard = client.get(f"/api/users/{target_user_id}/dashboard?domain=platform")
    assert target_dashboard.json()["xp"]["lesson_completion_xp"] == 20


def test_platform_learner_state_import_is_concurrency_safe():
    platform_courses = client.get("/api/courses?domain=platform").json()
    lesson_id = platform_courses[0]["lessons"][0]["id"]
    target_user_id = "platform-import-concurrency-target"
    lab_slug = "trace-service-to-pod"
    activity_target_id = "kubernetes-debugging-cheatsheet"
    state = {
        "schema_version": 1,
        "exported_at": "2026-05-28T00:00:00",
        "source_user_id": "platform-import-concurrency-source",
        "progress": [{"lesson_id": lesson_id, "completed": True, "score": 1}],
        "activity": [{"target_type": "resource", "target_id": activity_target_id, "state": "completed"}],
        "lab_submissions": [
            {
                "lab_slug": lab_slug,
                "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            }
        ],
    }

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(
            executor.map(
                lambda _: client.post(
                    "/api/platform-academy/state/import",
                    json={"target_user_id": target_user_id, "state": state},
                ),
                range(8),
            )
        )

    assert all(response.status_code == 200 for response in responses)
    assert all(
        response.json() == {
            "user_id": target_user_id,
            "progress_imported": 1,
            "activity_imported": 1,
            "lab_submissions_imported": 1,
        }
        for response in responses
    )

    with SessionLocal() as db:
        progress_count = db.query(Progress).filter(Progress.user_id == target_user_id, Progress.lesson_id == lesson_id).count()
        activity_count = (
            db.query(PlatformActivity)
            .filter(
                PlatformActivity.user_id == target_user_id,
                PlatformActivity.target_type == "resource",
                PlatformActivity.target_id == activity_target_id,
            )
            .count()
        )
        lab_submission_count = (
            db.query(PlatformLabSubmission)
            .filter(PlatformLabSubmission.user_id == target_user_id, PlatformLabSubmission.lab_slug == lab_slug)
            .count()
        )
        xp_count = (
            db.query(XpEvent)
            .filter(XpEvent.user_id == target_user_id, XpEvent.source == "lesson_completion", XpEvent.source_id == lesson_id)
            .count()
        )
    assert progress_count == 1
    assert activity_count == 1
    assert lab_submission_count == 1
    assert xp_count == 1


def test_platform_learner_state_import_rejects_oversized_backup_payloads():
    base_state = {
        "schema_version": 1,
        "exported_at": "2026-05-28T00:00:00",
        "source_user_id": "platform-export-source",
        "progress": [],
        "activity": [],
        "lab_submissions": [],
    }
    too_many_progress_rows = {
        **base_state,
        "progress": [
            {"lesson_id": 100000 + index, "completed": True, "score": 1}
            for index in range(MAX_PLATFORM_STATE_PROGRESS_ROWS + 1)
        ],
    }

    response = client.post(
        "/api/platform-academy/state/import",
        json={"target_user_id": "platform-export-target-too-large", "state": too_many_progress_rows},
    )
    assert response.status_code == 422

    too_large_worksheet_answer = {
        **base_state,
        "lab_submissions": [
            {
                "lab_slug": "trace-service-to-pod",
                "worksheet_answers": {"worksheet-0": "x" * (MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH + 1)},
                "checked_items": {},
                "status": "submitted",
            }
        ],
    }
    response = client.post(
        "/api/platform-academy/state/import",
        json={"target_user_id": "platform-export-target-too-large", "state": too_large_worksheet_answer},
    )
    assert response.status_code == 422


def test_user_id_validation_rejects_unsafe_or_oversized_values():
    platform_lesson_id = client.get("/api/courses?domain=platform").json()[0]["lessons"][0]["id"]
    invalid_user_ids = ["bad user", "bad/user", "x" * (MAX_USER_ID_LENGTH + 1)]

    for invalid_user_id in invalid_user_ids:
        progress = client.post(
            "/api/progress",
            json={"user_id": invalid_user_id, "lesson_id": platform_lesson_id, "completed": True, "score": 1},
        )
        assert progress.status_code == 422

        activity = client.post(
            "/api/platform-academy/activity",
            json={
                "user_id": invalid_user_id,
                "target_type": "resource",
                "target_id": "kubernetes-debugging-cheatsheet",
                "state": "completed",
            },
        )
        assert activity.status_code == 422

        lab_submission = client.post(
            "/api/platform-academy/labs/trace-service-to-pod/submission",
            json={
                "user_id": invalid_user_id,
                "worksheet_answers": {"worksheet-0": "selector mismatch"},
                "checked_items": {},
                "status": "submitted",
            },
        )
        assert lab_submission.status_code == 422

        imported = client.post(
            "/api/platform-academy/state/import",
            json={
                "target_user_id": invalid_user_id,
                "state": {
                    "schema_version": 1,
                    "exported_at": "2026-05-28T00:00:00",
                    "source_user_id": "platform-export-source",
                    "progress": [],
                    "activity": [],
                    "lab_submissions": [],
                },
            },
        )
        assert imported.status_code == 422

    for invalid_user_id in ["bad%20user", "x" * (MAX_USER_ID_LENGTH + 1)]:
        assert client.get(f"/api/users/{invalid_user_id}/dashboard?domain=platform").status_code == 422
        assert client.get(f"/api/platform-academy/activity/{invalid_user_id}").status_code == 422
        assert client.get(f"/api/platform-academy/state/{invalid_user_id}/export").status_code == 422


def test_platform_activity_rejects_unsafe_state_tokens():
    valid_payload = {
        "user_id": "platform-activity-validation-user",
        "target_type": "resource",
        "target_id": "kubernetes-debugging-cheatsheet",
        "state": "completed",
    }

    for field_name, invalid_value in {
        "target_type": "bad type",
        "target_id": "bad/target",
        "state": "needs review",
    }.items():
        response = client.post("/api/platform-academy/activity", json={**valid_payload, field_name: invalid_value})
        assert response.status_code == 422

    unsafe_import = client.post(
        "/api/platform-academy/state/import",
        json={
            "target_user_id": "platform-activity-import-validation",
            "state": {
                "schema_version": 1,
                "exported_at": "2026-05-28T00:00:00",
                "source_user_id": "platform-export-source",
                "progress": [],
                "activity": [{"target_type": "resource", "target_id": "bad/target", "state": "completed"}],
                "lab_submissions": [],
            },
        },
    )
    assert unsafe_import.status_code == 422


def test_platform_lab_submission_rejects_unknown_status_values():
    response = client.post(
        "/api/platform-academy/labs/trace-service-to-pod/submission",
        json={
            "user_id": "platform-lab-status-validation",
            "worksheet_answers": {"worksheet-0": "selector mismatch"},
            "checked_items": {},
            "status": "needs_review",
        },
    )
    assert response.status_code == 422

    unsafe_import = client.post(
        "/api/platform-academy/state/import",
        json={
            "target_user_id": "platform-lab-status-import-validation",
            "state": {
                "schema_version": 1,
                "exported_at": "2026-05-28T00:00:00",
                "source_user_id": "platform-export-source",
                "progress": [],
                "activity": [],
                "lab_submissions": [
                    {
                        "lab_slug": "trace-service-to-pod",
                        "worksheet_answers": {"worksheet-0": "selector mismatch"},
                        "checked_items": {},
                        "status": "needs_review",
                    }
                ],
            },
        },
    )
    assert unsafe_import.status_code == 422


def test_platform_lab_submission_rejects_oversized_workbook_payloads():
    too_many_answers = {
        f"worksheet-{index}": "Evidence note"
        for index in range(MAX_PLATFORM_STATE_WORKSHEET_FIELDS + 1)
    }
    response = client.post(
        "/api/platform-academy/labs/trace-service-to-pod/submission",
        json={
            "user_id": "platform-workbook-too-large",
            "worksheet_answers": too_many_answers,
            "checked_items": {},
            "status": "submitted",
        },
    )
    assert response.status_code == 422

    response = client.post(
        "/api/platform-academy/labs/trace-service-to-pod/submission",
        json={
            "user_id": "platform-workbook-answer-too-large",
            "worksheet_answers": {"worksheet-0": "x" * (MAX_PLATFORM_STATE_WORKSHEET_VALUE_LENGTH + 1)},
            "checked_items": {},
            "status": "submitted",
        },
    )
    assert response.status_code == 422


def test_platform_learner_state_openapi_documents_backup_contract():
    spec = client.get("/openapi.json").json()
    paths = spec["paths"]
    schemas = spec["components"]["schemas"]

    export_operation = paths["/api/platform-academy/state/{user_id}/export"]["get"]
    assert export_operation["summary"] == "Export Platform Academy learner state"
    assert "Platform Academy lesson progress" in export_operation["description"]
    assert str(MAX_PLATFORM_STATE_PROGRESS_ROWS) in export_operation["description"]

    import_operation = paths["/api/platform-academy/state/import"]["post"]
    assert import_operation["summary"] == "Import Platform Academy learner state"
    assert str(MAX_PLATFORM_STATE_WORKSHEET_FIELDS) in import_operation["description"]
    assert "Payload fails schema version" in import_operation["responses"]["422"]["description"]

    backup_schema = schemas["PlatformLearnerStateExport"]["properties"]
    assert backup_schema["progress"]["maxItems"] == MAX_PLATFORM_STATE_PROGRESS_ROWS
    assert backup_schema["activity"]["maxItems"] == MAX_PLATFORM_STATE_ACTIVITY_ROWS
    assert backup_schema["lab_submissions"]["maxItems"] == MAX_PLATFORM_STATE_LAB_ROWS

    lab_submission_schema = schemas["PlatformLabSubmissionIn"]["properties"]
    assert lab_submission_schema["user_id"]["maxLength"] == MAX_USER_ID_LENGTH
    assert lab_submission_schema["user_id"]["pattern"] == USER_ID_PATTERN
    assert lab_submission_schema["status"]["enum"] == [PLATFORM_LAB_STATUS_IN_PROGRESS, PLATFORM_LAB_STATUS_SUBMITTED]
    assert lab_submission_schema["worksheet_answers"]["maxProperties"] == MAX_PLATFORM_STATE_WORKSHEET_FIELDS
    assert lab_submission_schema["checked_items"]["maxProperties"] == MAX_PLATFORM_STATE_CHECKED_FIELDS
    save_operation = paths["/api/platform-academy/labs/{lab_slug}/submission"]["post"]
    assert "unknown client keys cannot inflate completion" in save_operation["description"]
    source_bundle_operation = paths["/api/platform-academy/labs/{lab_slug}/bundle"]["get"]
    assert source_bundle_operation["summary"] == "Get Platform Academy Instructor Source Bundle"
    assert source_bundle_operation["responses"]["403"]["description"] == "Non-local deployments require an instructor source-bundle token."
    source_bundle_token_parameter = next(
        parameter
        for parameter in source_bundle_operation["parameters"]
        if parameter["name"] == "X-Platform-Source-Bundle-Token"
    )
    assert "Instructor/source bundle token" in source_bundle_token_parameter["description"]
    assert_openapi_download_headers(source_bundle_operation["responses"]["200"])
    assert_openapi_download_headers(source_bundle_operation["responses"]["403"], include_content_disposition=False)
    packet_operation = paths["/api/platform-academy/labs/{lab_slug}/packet"]["get"]
    assert_openapi_download_headers(packet_operation["responses"]["200"])
    workspace_bundle_operation = paths["/api/platform-academy/labs/{lab_slug}/workspace-bundle"]["get"]
    assert_openapi_download_headers(workspace_bundle_operation["responses"]["200"])

    activity_schema = schemas["PlatformActivityIn"]["properties"]
    assert activity_schema["target_type"]["pattern"] == PLATFORM_STATE_TOKEN_PATTERN
    assert activity_schema["target_id"]["pattern"] == PLATFORM_STATE_TOKEN_PATTERN
    assert activity_schema["state"]["pattern"] == PLATFORM_STATE_TOKEN_PATTERN

    import_schema = schemas["PlatformLearnerStateImportIn"]["properties"]
    assert import_schema["target_user_id"]["maxLength"] == MAX_USER_ID_LENGTH
    assert import_schema["target_user_id"]["pattern"] == USER_ID_PATTERN


def test_platform_academy_product_metrics_record_bounded_product_events():
    user_id = "platform-product-metrics-user"
    lab_slug = "trace-service-to-pod"

    assert client.get(f"/api/platform-academy/labs/{lab_slug}/packet").status_code == 200
    assert client.get(f"/api/platform-academy/labs/{lab_slug}/bundle").status_code == 200
    assert (
        client.post(
            "/api/platform-academy/activity",
            json={
                "user_id": user_id,
                "target_type": "interview_question",
                "target_id": "kubernetes-debugging-interview-pack:1",
                "state": "completed",
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/platform-academy/activity",
            json={"user_id": user_id, "target_type": "custom-client-value", "target_id": "one-off", "state": "surprise"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/platform-academy/labs/{lab_slug}/submission",
            json={
                "user_id": user_id,
                "worksheet_answers": {"worksheet-0": "selector mismatch between Service and Pod labels"},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            },
        ).status_code
        == 200
    )
    assert client.get(f"/api/users/{user_id}/dashboard?domain=platform").status_code == 200

    metrics = client.get("/metrics").text
    assert "zhongwen_platform_activity_saves_total" in metrics
    assert 'target_type="interview_question"' in metrics
    assert 'state="completed"' in metrics
    assert 'target_type="other"' in metrics
    assert 'state="other"' in metrics
    assert "zhongwen_platform_lab_packet_downloads_total" in metrics
    assert "zhongwen_platform_lab_bundle_downloads_total" in metrics
    assert "zhongwen_platform_lab_submissions_total" in metrics
    assert f'lab_slug="{lab_slug}"' in metrics
    assert 'status="submitted"' in metrics
    assert "zhongwen_platform_dashboard_reads_total" in metrics
    assert 'domain="platform"' in metrics


def test_course_domain_filters_keep_zhongwen_and_platform_separate():
    zhongwen = client.get("/api/courses?domain=zhongwen")
    assert zhongwen.status_code == 200
    assert zhongwen.json()
    assert all(course["era"] != "Platform Academy" for course in zhongwen.json())

    platform = client.get("/api/courses?domain=platform")
    assert platform.status_code == 200
    platform_courses = platform.json()
    assert len(platform_courses) >= 15
    assert all(course["era"] == "Platform Academy" for course in platform_courses)

    invalid = client.get("/api/courses?domain=bad")
    assert invalid.status_code == 400


def test_lesson_and_flashcards():
    courses = client.get("/api/courses").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    lesson = client.get(f"/api/lessons/{lesson_id}")
    assert lesson.status_code == 200
    assert lesson.json()["vocabulary"]
    cards = client.get(f"/api/flashcards?lesson_id={lesson_id}")
    assert cards.status_code == 200
    assert cards.json()


def test_platform_lesson_contains_teaching_terms_and_review_prompts():
    catalog = client.get("/api/platform-academy/catalog").json()
    lesson_id = next(track for track in catalog["tracks"] if track["slug"] == "eks-operations")["course"]["lessons"][2]["id"]
    lesson = client.get(f"/api/lessons/{lesson_id}")
    assert lesson.status_code == 200
    payload = lesson.json()
    assert payload["course_era"] == "Platform Academy"
    assert "IRSA" in payload["body_simplified"]
    assert "service account" in payload["body_simplified"]
    assert payload["vocabulary"]
    assert payload["flashcards"]

    search = client.get("/api/search?q=CrashLoopBackOff")
    assert search.status_code == 200
    assert search.json()["lessons"]


def test_progress_and_quiz_attempt():
    payload = {"user_id": "demo-user", "lesson_id": 1, "completed": True, "score": 0.9}
    progress = client.post("/api/progress", json=payload)
    assert progress.status_code == 200
    assert progress.json()["completed"] is True

    attempt = client.post("/api/quiz/attempts", json={"user_id": "demo-user", "lesson_id": 1, "score": 0.8, "answers": {"1": "hello"}})
    assert attempt.status_code == 200
    assert attempt.json()["score"] == 0.8


def test_progress_creates_guest_user_before_progress_rows():
    courses = client.get("/api/courses?domain=platform").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    user_id = "guest-api-progress-regression"

    progress = client.post("/api/progress", json={"user_id": user_id, "lesson_id": lesson_id, "completed": True, "score": 1})
    assert progress.status_code == 200
    assert progress.json()["user_id"] == user_id
    assert progress.json()["completed"] is True

    rows = client.get(f"/api/progress/{user_id}")
    assert rows.status_code == 200
    assert any(row["lesson_id"] == lesson_id and row["completed"] for row in rows.json())

    dashboard = client.get(f"/api/users/{user_id}/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["completed_lessons"] >= 1
    assert dashboard.json()["xp"]["lesson_completion_xp"] >= 20


def test_progress_completion_is_concurrency_safe():
    courses = client.get("/api/courses?domain=platform").json()
    lesson_id = courses[0]["lessons"][0]["id"]
    user_id = "guest-progress-concurrency"
    payload = {"user_id": user_id, "lesson_id": lesson_id, "completed": True, "score": 1}

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: client.post("/api/progress", json=payload), range(8)))

    assert all(response.status_code == 200 for response in responses)
    assert len({response.json()["id"] for response in responses}) == 1

    with SessionLocal() as db:
        progress_count = db.query(Progress).filter(Progress.user_id == user_id, Progress.lesson_id == lesson_id).count()
        xp_count = (
            db.query(XpEvent)
            .filter(XpEvent.user_id == user_id, XpEvent.source == "lesson_completion", XpEvent.source_id == lesson_id)
            .count()
        )
    assert progress_count == 1
    assert xp_count == 1


def test_platform_activity_tracks_guest_prep_state():
    user_id = "guest-activity-regression"
    payload = {
        "user_id": user_id,
        "target_type": "interview_question",
        "target_id": "kubernetes-debugging-interview-pack:1",
        "state": "completed",
    }

    first = client.post("/api/platform-academy/activity", json=payload)
    assert first.status_code == 200
    assert first.json()["user_id"] == user_id
    assert first.json()["state"] == "completed"

    updated = client.post("/api/platform-academy/activity", json={**payload, "state": "review"})
    assert updated.status_code == 200
    assert updated.json()["id"] == first.json()["id"]
    assert updated.json()["state"] == "review"

    rows = client.get(f"/api/platform-academy/activity/{user_id}")
    assert rows.status_code == 200
    assert rows.json() == [updated.json()]


def test_platform_activity_upsert_is_concurrency_safe():
    user_id = "guest-activity-concurrency"
    payload = {
        "user_id": user_id,
        "target_type": "resource",
        "target_id": "kubernetes-debugging-cheatsheet",
        "state": "completed",
    }

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: client.post("/api/platform-academy/activity", json=payload), range(8)))

    assert all(response.status_code == 200 for response in responses)
    assert len({response.json()["id"] for response in responses}) == 1

    with SessionLocal() as db:
        activity_count = (
            db.query(PlatformActivity)
            .filter(
                PlatformActivity.user_id == user_id,
                PlatformActivity.target_type == payload["target_type"],
                PlatformActivity.target_id == payload["target_id"],
            )
            .count()
        )
    assert activity_count == 1


def test_platform_dashboard_scope_excludes_legacy_learning_content():
    all_courses = client.get("/api/courses").json()
    platform_courses = client.get("/api/courses?domain=platform").json()
    legacy_lesson_id = next(course for course in all_courses if course["era"] != "Platform Academy")["lessons"][0]["id"]
    platform_lesson_id = platform_courses[0]["lessons"][0]["id"]
    user_id = "guest-platform-scope-regression"

    legacy_progress = client.post("/api/progress", json={"user_id": user_id, "lesson_id": legacy_lesson_id, "completed": True, "score": 1})
    platform_progress = client.post(
        "/api/progress",
        json={"user_id": user_id, "lesson_id": platform_lesson_id, "completed": True, "score": 1},
    )
    assert legacy_progress.status_code == 200
    assert platform_progress.status_code == 200

    global_dashboard = client.get(f"/api/users/{user_id}/dashboard")
    platform_dashboard = client.get(f"/api/users/{user_id}/dashboard?domain=platform")
    assert global_dashboard.status_code == 200
    assert platform_dashboard.status_code == 200

    global_payload = global_dashboard.json()
    platform_payload = platform_dashboard.json()
    assert global_payload["completed_lessons"] >= 2
    assert global_payload["xp"]["lesson_completion_xp"] >= 40
    assert global_payload["due_reviews"] > platform_payload["due_reviews"]
    assert platform_payload["completed_lessons"] == 1
    assert platform_payload["xp"]["lesson_completion_xp"] == 20
    assert platform_payload["due_reviews"] > 0


def test_platform_dashboard_awards_platform_specific_achievements():
    user_id = "guest-platform-achievement-regression"
    platform_courses = client.get("/api/courses?domain=platform").json()
    lesson_id = platform_courses[0]["lessons"][0]["id"]
    lab_slug = "trace-service-to-pod"

    assert client.post("/api/progress", json={"user_id": user_id, "lesson_id": lesson_id, "completed": True, "score": 1}).status_code == 200
    assert (
        client.post(
            "/api/platform-academy/activity",
            json={"user_id": user_id, "target_type": "resource", "target_id": "kubernetes-debugging-cheatsheet", "state": "completed"},
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/platform-academy/activity",
            json={
                "user_id": user_id,
                "target_type": "interview_question",
                "target_id": "kubernetes-debugging-interview-pack:1",
                "state": "completed",
            },
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"/api/platform-academy/labs/{lab_slug}/submission",
            json={
                "user_id": user_id,
                "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            },
        ).status_code
        == 200
    )

    response = client.get(f"/api/users/{user_id}/dashboard?domain=platform")
    assert response.status_code == 200
    achievements = response.json()["achievements"]
    earned = {achievement["code"] for achievement in achievements if achievement["earned"]}
    assert {"platform_pathfinder", "resource_curator", "interview_operator", "cluster_debugger"}.issubset(earned)
    assert "poetry_explorer" not in {achievement["code"] for achievement in achievements}
    assert "character_builder" not in {achievement["code"] for achievement in achievements}


def test_platform_dashboard_achievement_awards_are_concurrency_safe():
    user_id = "guest-platform-achievement-concurrency"
    lab_slug = "trace-service-to-pod"
    assert (
        client.post(
            f"/api/platform-academy/labs/{lab_slug}/submission",
            json={
                "user_id": user_id,
                "worksheet_answers": {"worksheet-0": "Service selector and Pod labels differ."},
                "checked_items": {"worksheet-0": True, "validation-0": True},
                "status": "submitted",
            },
        ).status_code
        == 200
    )

    def fetch_dashboard():
        return client.get(f"/api/users/{user_id}/dashboard?domain=platform")

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: fetch_dashboard(), range(8)))

    assert all(response.status_code == 200 for response in responses)
    for response in responses:
        earned = {achievement["code"] for achievement in response.json()["achievements"] if achievement["earned"]}
        assert "cluster_debugger" in earned

    with SessionLocal() as db:
        count = (
            db.query(UserAchievement)
            .filter(UserAchievement.user_id == user_id, UserAchievement.code == "cluster_debugger")
            .count()
        )
    assert count == 1


def test_platform_interview_prep_catalog_is_content_rich():
    response = client.get("/api/platform-academy/interview-prep")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_questions"] >= 200
    assert "Kubernetes" in payload["domains"]
    assert "AWS Operations" in payload["domains"]
    assert "CI/CD" in payload["domains"]
    assert "Career" in payload["domains"]
    assert "Linux" in payload["domains"]
    assert "Networking" in payload["domains"]
    assert "Observability" in payload["domains"]
    assert "FinOps" in payload["domains"]
    assert "Advanced" in payload["levels"]
    assert all(len(pack["questions"]) >= 9 for pack in payload["packs"])
    pack = next(item for item in payload["packs"] if item["slug"] == "kubernetes-debugging-interview-pack")
    assert len(pack["questions"]) >= 5
    assert pack["official_sources"][0]["url"].startswith("https://")
    assert "EndpointSlices" in " ".join(pack["questions"][0]["answer_outline"] + pack["questions"][0]["strong_signals"])
    career_pack = next(item for item in payload["packs"] if item["slug"] == "career-recruiter-screen-interview-pack")
    assert "layoff" in " ".join(question["question"] + " " + question["scenario"] for question in career_pack["questions"]).lower()


def test_search_and_metrics():
    search = client.get("/api/search?q=Tang")
    assert search.status_code == 200
    assert search.json()["courses"]
    metrics = client.get("/metrics")
    assert metrics.status_code == 200
    assert "zhongwen_api_requests_total" in metrics.text


def test_seed_database_is_repeatable_after_reset():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
        first_count = len(client.get("/api/courses").json())
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_database(db)
    second_count = len(client.get("/api/courses").json())
    assert second_count == first_count


def test_admin_upload_course_flow():
    payload = {
        "slug": "calligraphy-orchid-preface",
        "title": "Calligraphy: Wang Xizhi and the Orchid Pavilion Preface",
        "era": "Eastern Jin",
        "level": "Advanced",
        "category": "Art",
        "description": "Upload flow smoke test for a course about 行书 rhythm, gathering, and cultural memory.",
        "subscription_tier": "mock_active",
        "lessons": [
            {
                "title": "Reading 行书 as Movement",
                "summary": "A short authoring-flow lesson with vocabulary and flashcards.",
                "body_simplified": "《兰亭集序》表现了书法的节奏、聚会的雅趣和时间的感叹。",
                "body_traditional": "《蘭亭集序》表現了書法的節奏、聚會的雅趣和時間的感嘆。",
                "pinyin": "Lántíng jí xù biǎoxiàn le shūfǎ de jiézòu.",
                "audio_url": None,
                "video_url": "https://example.com/media/orchid-preface.mp4",
                "vocabulary": [
                    {"simplified": "书法", "traditional": "書法", "pinyin": "shūfǎ", "definition": "calligraphy"},
                    {"simplified": "节奏", "traditional": "節奏", "pinyin": "jiézòu", "definition": "rhythm"},
                ],
                "flashcards": [
                    {"prompt": "What does 书法 mean?", "answer": "calligraphy", "pinyin": "shūfǎ", "difficulty": "intermediate"}
                ],
            }
        ],
    }

    created = client.post("/api/admin/courses", json=payload)
    assert created.status_code == 201
    course = created.json()
    assert course["slug"] == "calligraphy-orchid-preface"
    assert course["lessons"][0]["title"] == "Reading 行书 as Movement"

    duplicate = client.post("/api/admin/courses", json=payload)
    assert duplicate.status_code == 409

    search = client.get("/api/search?q=兰亭")
    assert search.status_code == 200
    assert search.json()["lessons"]


def test_learning_path_marks_completion_and_recommendation():
    courses = client.get("/api/courses").json()
    first_lesson_id = courses[0]["lessons"][0]["id"]
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": first_lesson_id, "completed": True, "score": 1})

    response = client.get("/api/learning-path?user_id=demo-user")
    assert response.status_code == 200
    path = response.json()

    assert path["user_id"] == "demo-user"
    assert path["modules"]
    lesson_states = [lesson["state"] for module in path["modules"] for lesson in module["lessons"]]
    assert "completed" in lesson_states
    assert "recommended" in lesson_states
    assert "locked" in lesson_states


def test_user_dashboard_reports_xp_streak_goal_and_achievements():
    courses = client.get("/api/courses").json()
    first_lesson_id = courses[0]["lessons"][0]["id"]
    poetry_lesson_id = next(
        lesson["id"]
        for course in courses
        if course["category"] == "Literature"
        for lesson in course["lessons"]
    )
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": first_lesson_id, "completed": True, "score": 1})
    client.post("/api/progress", json={"user_id": "demo-user", "lesson_id": poetry_lesson_id, "completed": True, "score": 1})
    client.post(
        "/api/quiz/attempts",
        json={"user_id": "demo-user", "lesson_id": first_lesson_id, "score": 0.8, "answers": {"tone": "声调"}},
    )

    response = client.get("/api/users/demo-user/dashboard")
    assert response.status_code == 200
    dashboard = response.json()

    assert dashboard["xp"]["total"] >= 48
    assert dashboard["xp"]["total"] == dashboard["xp"]["lesson_completion_xp"] + dashboard["xp"]["quiz_xp"] + dashboard["xp"]["review_xp"]
    assert dashboard["daily_goal"]["target_xp"] == 50
    assert dashboard["daily_goal"]["earned_xp_today"] >= 48
    assert dashboard["streak"]["current_days"] >= 1
    earned = {achievement["code"] for achievement in dashboard["achievements"] if achievement["earned"]}
    assert {"first_lesson", "poetry_explorer"}.issubset(earned)


def test_due_reviews_and_answer_update_schedule():
    card = client.get("/api/flashcards").json()[0]

    due = client.get("/api/reviews/due?user_id=demo-user")
    assert due.status_code == 200
    assert any(item["id"] == card["id"] for item in due.json()["cards"])

    answer = client.post(f"/api/reviews/{card['id']}/answer", json={"user_id": "demo-user", "quality": 5, "correct": True})
    assert answer.status_code == 200
    updated = answer.json()
    assert updated["flashcard_id"] == card["id"]
    assert updated["interval_days"] >= 1
    assert updated["ease"] > 2
    assert updated["due_at"] > updated["last_reviewed_at"]


def test_review_answer_initial_state_is_concurrency_safe():
    card = client.get("/api/flashcards").json()[0]
    user_id = "review-answer-concurrency"
    payload = {"user_id": user_id, "quality": 5, "correct": True}

    with ThreadPoolExecutor(max_workers=8) as executor:
        responses = list(executor.map(lambda _: client.post(f"/api/reviews/{card['id']}/answer", json=payload), range(8)))

    assert all(response.status_code == 200 for response in responses)
    assert all(response.json()["flashcard_id"] == card["id"] for response in responses)

    with SessionLocal() as db:
        review_state_count = (
            db.query(ReviewState).filter(ReviewState.user_id == user_id, ReviewState.flashcard_id == card["id"]).count()
        )
        xp_count = (
            db.query(XpEvent)
            .filter(XpEvent.user_id == user_id, XpEvent.source == "srs_review", XpEvent.source_id == card["id"])
            .count()
        )
    assert review_state_count == 1
    assert xp_count == 1


def test_character_practice_metadata():
    response = client.get("/api/characters")
    assert response.status_code == 200
    characters = response.json()
    moon = next(item for item in characters if item["simplified"] == "月")
    assert moon["traditional"] == "月"
    assert moon["pinyin"] == "yuè"
    assert moon["radical"]
    assert moon["strokes"] > 0
    assert moon["example_words"]

    detail = client.get(f"/api/characters/{moon['id']}")
    assert detail.status_code == 200
    assert detail.json()["mnemonic"]
