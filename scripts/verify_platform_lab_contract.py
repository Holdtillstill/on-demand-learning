#!/usr/bin/env python3
"""Verify the Platform Academy lab catalog against repo-backed artifacts."""

from __future__ import annotations

import argparse
import re
import stat
import subprocess
import sys
from pathlib import Path
from typing import Iterable

REPO_ROOT = Path(__file__).resolve().parents[1]
API_ROOT = REPO_ROOT / "apps" / "api"
LAB_ROOT = REPO_ROOT / "labs" / "platform-academy"
LAB_ROOT_README = LAB_ROOT / "README.md"
REQUIRED_LAB_FILES = {"README.md", "solution.md", "validate.sh", "cleanup.sh"}
REQUIRED_ROOT_SCRIPTS = {"run-lab.sh", "verify-full-labs.sh"}
IGNORED_LAB_ROOT_DIRS = {"__pycache__", "lib"}
REQUIRED_ROOT_README_SECTIONS = {
    "## Quick Start",
    "## Safety Model",
    "## App Integration",
    "## Lab Catalog",
    "## CI Contract",
    "## Cleanup",
}
REQUIRED_ROOT_README_SNIPPETS = {
    "make platform-lab-verify",
    "make platform-lab-contract",
    "make platform-lab-artifact-contract",
    "bash labs/platform-academy/run-lab.sh list",
    "bash labs/platform-academy/run-lab.sh show trace-service-to-pod",
    "bash labs/platform-academy/run-lab.sh packet trace-service-to-pod",
    "bash labs/platform-academy/run-lab.sh workspace trace-service-to-pod",
    "bash labs/platform-academy/run-lab.sh setup trace-service-to-pod",
    "bash labs/platform-academy/run-lab.sh setup review-yaml-before-apply",
    "bash labs/platform-academy/run-lab.sh validate trace-service-to-pod",
    "bash labs/platform-academy/verify-full-labs.sh",
    "bash labs/platform-academy/verify-full-labs.sh --cluster",
    "PLATFORM_LAB_ALLOW_NONLOCAL_CLUSTER=1",
}
DEEPENED_LAB_CONTRACT = {
    "trace-service-to-pod": {
        "files": {"broken-evidence.txt", "evidence-template.md", "service_route_analyzer.py"},
        "terms": {
            "Service selector",
            "Pod label",
            "EndpointSlice",
            "source-manifest",
            "cleanup",
            "Service routing analysis passed",
        },
    },
    "debug-crashloop-imagepull": {
        "files": {"broken-evidence.txt", "evidence-template.md", "failure_mode_analyzer.py"},
        "terms": {
            "CrashLoop/ImagePull analysis passed",
            "CrashLoopBackOff",
            "ImagePullBackOff",
            "previous",
            "registry",
            "cleanup",
        },
    },
    "review-yaml-before-apply": {
        "files": {"evidence-template.md", "manifest_risk_analyzer.py", "setup.sh"},
        "terms": {
            "ClusterRole",
            "YAML manifest risk analysis passed",
            "resources: [\"pods\", \"secrets\"]",
            "privileged: true",
            "hostPath",
            "stringData.token",
        },
    },
    "inspect-linux-failure-evidence": {
        "files": {"evidence-template.md", "linux_failure_analyzer.py", "setup.sh"},
        "terms": {
            "CrashLoopBackOff",
            "Exit Code:    126",
            "Linux failure evidence analysis passed",
            "/app/bin/checkout: Permission denied",
            "uid=10001(checkout)",
            "Running as root",
        },
    },
    "trace-network-path": {
        "files": {"evidence-template.md", "network_path_analyzer.py", "setup.sh"},
        "terms": {
            "HTTP/2 503",
            "Network path analysis passed",
            "Target.ResponseCodeMismatch",
            "targetPort web",
            "targetPort: http",
            "source-manifest",
        },
    },
    "debug-aws-alb-health-path": {
        "files": {"alb_health_analyzer.py", "evidence-template.md", "setup.sh"},
        "terms": {"ALB", "ALB health path analysis passed", "Target.ResponseCodeMismatch", "targetPort", "health", "owner"},
    },
    "diagnose-eks-ip-exhaustion": {
        "files": {"evidence-template.md", "ip_exhaustion_analyzer.py", "setup.sh"},
        "terms": {
            "FailedScheduling",
            "FailedCreatePodSandBox",
            "subnet-bbb222",
            "AvailableIPv4AddressCount=7",
            "prefix delegation disabled",
            "EKS IP exhaustion analysis passed",
            "Nodes near maxPods",
        },
    },
    "design-production-eks-review": {
        "files": {"evidence-template.md", "production_review_analyzer.py", "setup.sh"},
        "terms": {
            "Endpoint: public and private",
            "pdb=missing",
            "Missing cost label on apps-c",
            "controller add-ons",
            "FinOps owner",
            "Production EKS review analysis passed",
        },
    },
    "review-terraform-eks-plan": {
        "files": {"evidence-template.md"},
        "terms": {"terraform apply", "must be replaced", "0.0.0.0/0", "eks:*", "Do not approve"},
    },
    "debug-irsa-access-denied": {
        "files": {"evidence-template.md"},
        "terms": {"ServiceAccount", "AccessDenied", "PutObject", "system:serviceaccount:payments:checkout", "least-privilege"},
    },
    "audit-tenant-boundaries": {
        "files": {"evidence-template.md", "setup.sh", "tenant_boundary_analyzer.py"},
        "terms": {
            "cluster-admin",
            "secrets",
            "restricted",
            "allow-all-egress",
            "Block onboarding",
            "Tenant boundary analysis passed",
        },
    },
    "validate-helm-release-artifact": {
        "files": {"evidence-template.md", "helm_release_analyzer.py", "setup.sh"},
        "terms": {
            "immutable selector",
            "checkout:latest",
            "privileged: true",
            "LoadBalancer",
            "Block the release",
            "Helm release artifact analysis passed",
        },
    },
    "trace-argocd-drift": {
        "files": {"evidence-template.md"},
        "terms": {"replicas: 3", "replicas: 9", "autoscaling", "/spec/replicas", "Git-owned"},
    },
    "review-docker-image-supply-chain": {
        "files": {"evidence-template.md", "setup.sh", "supply_chain_analyzer.py"},
        "terms": {
            "checkout:latest",
            "RepoDigests",
            "API_TOKEN=do-not-bake-secrets",
            "SBOM",
            "Block promotion",
            "Docker supply-chain analysis passed",
        },
    },
    "design-safe-release-pipeline": {
        "files": {"evidence-template.md", "release_pipeline_analyzer.py", "setup.sh"},
        "terms": {
            "deploy-prod",
            "github.ref == 'refs/heads/main'",
            "image-digest.txt",
            "environment: production",
            "rollback-if-slo-breach",
            "Safe release pipeline analysis passed",
        },
    },
    "create-platform-golden-path": {
        "files": {"evidence-template.md", "golden_path_analyzer.py", "setup.sh"},
        "terms": {
            "Required Inputs",
            "pagerduty.com/service-id: missing",
            "platform.example.com/slo-dashboard: missing",
            "Adoption Metrics",
            "Production readiness review",
            "Golden path readiness analysis passed",
        },
    },
    "write-slo-backed-runbook": {
        "files": {"evidence-template.md", "setup.sh", "slo_runbook_analyzer.py"},
        "terms": {
            "CheckoutHighErrorBudgetBurn",
            "99.9%",
            "2% 5xx",
            "revision 43",
            "Incident commander",
            "SLO runbook analysis passed",
        },
    },
    "design-opentelemetry-signal-path": {
        "files": {"evidence-template.md", "setup.sh", "signal_path_analyzer.py"},
        "terms": {
            "http.request.header.authorization",
            "trace_id=missing",
            "customer_email",
            "sum by (le, route)",
            "Owner Map",
            "OpenTelemetry signal path analysis passed",
        },
    },
    "run-incident-commander-tabletop": {
        "files": {"evidence-template.md", "incident_tabletop_analyzer.py", "setup.sh"},
        "terms": {
            "SEV-2",
            "0.2%",
            "9.4%",
            "revision 42",
            "Communications lead",
            "Incident commander tabletop analysis passed",
        },
    },
    "audit-eks-cost-drivers": {
        "files": {"evidence-template.md", "cost_analyzer.py", "setup.sh"},
        "terms": {
            "EKS cost driver analysis passed",
            "Quick-win monthly exposure",
            "payments,checkout,6000,900",
            "abandoned-demo",
            "abandoned-cache",
            "Expected Savings",
            "Weekly: unknown owner",
        },
    },
    "build-platform-career-proof-pack": {
        "files": {"evidence-template.md"},
        "terms": {
            "Kubernetes, Terraform, AWS, CI/CD",
            "Candidate artifacts",
            "completed-proof-readme.md",
            "Incident Response",
            "Release Safety",
        },
    },
}
REQUIRED_README_SECTIONS = {
    "## Goal",
    "## Time",
    "## Safety",
    "## Starting State",
    "## Investigation",
    "## Validation",
    "## Success Criteria",
}
SOLUTION_PRIMARY_SECTIONS = {"## Blockers", "## Decision", "## Diagnosis", "## Findings"}
REPO_PATH_PATTERN = re.compile(r"labs/platform-academy/[A-Za-z0-9_./-]+")
MUTATING_KUBECTL_COMMANDS = {
    "annotate",
    "apply",
    "create",
    "delete",
    "label",
    "patch",
    "replace",
    "scale",
    "set",
}
MUTATING_KUBECTL_ROLLOUT_COMMANDS = {"restart", "undo"}
EXPECTED_PORTFOLIO_LAB_COUNT = 7

sys.path.insert(0, str(API_ROOT))

from app.platform_content import (  # noqa: E402
    FULL_LAB_SLUGS,
    LAB_ARTIFACT_PATHS,
    PLATFORM_LABS,
    PORTFOLIO_LAB_FOCUS,
    PORTFOLIO_LAB_SLUGS,
)
from app.platform_lab_artifacts import (  # noqa: E402
    LabArtifactError,
    lab_packet_markdown,
    learner_artifact_paths,
    write_lab_workspace,
)


class ContractFailure(Exception):
    pass


def fail(message: str) -> None:
    raise ContractFailure(message)


def repo_relative(path: Path) -> str:
    return path.relative_to(REPO_ROOT).as_posix()


def git_ignored(path: str) -> bool:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "check-ignore", "--non-matching", "--verbose", "--", path],
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    if result.returncode not in (0, 1):
        fail(f"could not check git ignore status for {path}")
    output = result.stdout.strip()
    if not output or output.startswith("::"):
        return False
    pattern_source = output.split("\t", 1)[0]
    pattern = pattern_source.split(":", 2)[-1]
    return not pattern.startswith("!")


def executable(path: Path) -> bool:
    return bool(path.stat().st_mode & (stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH))


def full_labs_in_catalog_order() -> list[dict]:
    return [lab for lab in PLATFORM_LABS if lab.get("lab_tier") == "full"]


def referenced_repo_paths(values: Iterable[str]) -> set[str]:
    paths: set[str] = set()
    for value in values:
        for match in REPO_PATH_PATTERN.findall(value):
            paths.add(match.rstrip("`'\".,:)"))
    return paths


def verify_unique_slugs() -> None:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for lab in PLATFORM_LABS:
        slug = lab["slug"]
        if slug in seen:
            duplicates.add(slug)
        seen.add(slug)
    if duplicates:
        fail(f"duplicate Platform Academy lab slugs: {sorted(duplicates)}")


def verify_lab_directory_inventory(full_slugs: set[str]) -> None:
    directories = {
        path.name
        for path in LAB_ROOT.iterdir()
        if path.is_dir() and not path.name.startswith(".") and path.name not in IGNORED_LAB_ROOT_DIRS
    }
    if directories != full_slugs:
        missing = sorted(full_slugs - directories)
        extra = sorted(directories - full_slugs)
        fail(f"full-lab directories mismatch; missing={missing}, extra={extra}")


def verify_root_readme_contract(full_slugs: Iterable[str]) -> None:
    if not LAB_ROOT_README.is_file():
        fail(f"{repo_relative(LAB_ROOT_README)} is missing")
    content = LAB_ROOT_README.read_text()
    missing_sections = sorted(section for section in REQUIRED_ROOT_README_SECTIONS if section not in content)
    if missing_sections:
        fail(f"{repo_relative(LAB_ROOT_README)} missing sections: {missing_sections}")
    missing_snippets = sorted(snippet for snippet in REQUIRED_ROOT_README_SNIPPETS if snippet not in content)
    if missing_snippets:
        fail(f"{repo_relative(LAB_ROOT_README)} missing quick-start snippets: {missing_snippets}")
    missing_slugs = sorted(slug for slug in full_slugs if f"{slug}/README.md" not in content)
    if missing_slugs:
        fail(f"{repo_relative(LAB_ROOT_README)} missing lab README links for: {missing_slugs}")
    for script_name in REQUIRED_ROOT_SCRIPTS:
        script = LAB_ROOT / script_name
        if not script.is_file():
            fail(f"{repo_relative(script)} is missing")
        if not executable(script):
            fail(f"{repo_relative(script)} is not executable")


def verify_platform_lab_docs_contract() -> None:
    required_snippets = {
        LAB_ROOT_README: {
            "public artifact paths match `learner_artifact_paths`",
            "withhold source `README.md` and `solution.md`",
            "`SOURCE-MANIFEST.txt`",
            "`X-Platform-Source-Bundle-Token`",
        },
        REPO_ROOT / "docs" / "platform-academy.md": {
            "Public lab `artifact_paths` are learner-safe and match `learner_artifact_paths`",
            "source `README.md` and `solution.md` stay out of the public learner payload",
            "Instructor/source bundles include `SOURCE-MANIFEST.txt`",
            "`X-Platform-Source-Bundle-Token`",
        },
        REPO_ROOT / "docs" / "platform-academy-handoff.md": {
            "API tests: `59 passed`",
            "Public lab payloads are learner-safe",
            "Instructor/source bundles still include the complete source artifact set and a `SOURCE-MANIFEST.txt`",
            "`PLATFORM_SOURCE_BUNDLE_TOKEN`",
        },
        REPO_ROOT / "docs" / "smoke-test-checklist.md": {
            "learner-safe public artifact paths",
            "instructor/source bundles, learner workspace bundles",
            "learner workspace contract",
            "`PLATFORM_SOURCE_BUNDLE_TOKEN`",
        },
        REPO_ROOT / "docs" / "release-checklist.md": {
            "`GET /api/platform-academy/labs/{lab_slug}/workspace-bundle`",
            "Public lab `artifact_paths` should remain learner-safe and match `learner_artifact_paths`",
            "Instructor/source bundles should keep `SOURCE-MANIFEST.txt`",
            "`X-Platform-Source-Bundle-Token`",
        },
    }
    for path, snippets in required_snippets.items():
        if not path.is_file():
            fail(f"{repo_relative(path)} is missing")
        content = path.read_text()
        missing = sorted(snippet for snippet in snippets if snippet not in content)
        if missing:
            fail(f"{repo_relative(path)} missing Platform Academy contract snippets: {missing}")


def verify_readme_contract(slug: str, readme: Path) -> None:
    content = readme.read_text()
    missing_sections = sorted(section for section in REQUIRED_README_SECTIONS if section not in content)
    if missing_sections:
        fail(f"{slug}/README.md missing sections: {missing_sections}")
    if "Full Lab:" not in content.splitlines()[0]:
        fail(f"{slug}/README.md title should identify the lab as a full lab")


def verify_solution_contract(slug: str, solution: Path) -> None:
    content = solution.read_text()
    first_line = content.splitlines()[0] if content.splitlines() else ""
    if "Solution:" not in first_line:
        fail(f"{slug}/solution.md title should identify the file as a solution")
    if not any(section in content for section in SOLUTION_PRIMARY_SECTIONS):
        fail(f"{slug}/solution.md should include one of {sorted(SOLUTION_PRIMARY_SECTIONS)}")
    if "## Cleanup" not in content:
        fail(f"{slug}/solution.md missing ## Cleanup section")


def mutating_kubectl_line_numbers(content: str) -> list[int]:
    lines: list[int] = []
    for line_number, line in enumerate(content.splitlines(), start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if stripped.startswith(("echo ", "printf ", "grep ")):
            continue
        match = re.search(r"\bkubectl\s+([a-z-]+)(?:\s+([a-z-]+))?", stripped)
        if not match:
            continue
        command = match.group(1)
        subcommand = match.group(2) or ""
        if command in MUTATING_KUBECTL_COMMANDS:
            lines.append(line_number)
        elif command == "rollout" and subcommand in MUTATING_KUBECTL_ROLLOUT_COMMANDS:
            lines.append(line_number)
    return lines


def first_line_number(content: str, needle: str) -> int | None:
    for line_number, line in enumerate(content.splitlines(), start=1):
        if needle in line:
            return line_number
    return None


def verify_script_contract(slug: str, script: Path, artifacts: set[str]) -> None:
    if not executable(script):
        fail(f"{repo_relative(script)} is not executable")
    content = script.read_text()
    if "cluster-safety.sh" in content and "labs/platform-academy/lib/cluster-safety.sh" not in artifacts:
        fail(f"{slug} script {script.name} sources cluster-safety.sh but the bundle omits it")
    if "evidence-check.sh" in content and "labs/platform-academy/lib/evidence-check.sh" not in artifacts:
        fail(f"{slug} script {script.name} sources evidence-check.sh but the bundle omits it")
    mutating_lines = mutating_kubectl_line_numbers(content)
    uses_guarded_cleanup = "delete_namespace_if_disposable" in content or "delete_clusterrolebinding_if_disposable" in content
    if mutating_lines or uses_guarded_cleanup:
        if "cluster-safety.sh" not in content:
            fail(f"{slug} script {script.name} mutates Kubernetes without sourcing cluster-safety.sh")
        if "labs/platform-academy/lib/cluster-safety.sh" not in artifacts:
            fail(f"{slug} script {script.name} needs cluster-safety.sh in artifact_paths")
    if mutating_lines:
        guard_line = first_line_number(content, "require_disposable_kube_context")
        if guard_line is None:
            fail(f"{slug} script {script.name} mutates Kubernetes without require_disposable_kube_context")
        first_mutation = min(mutating_lines)
        if guard_line > first_mutation:
            fail(
                f"{slug} script {script.name} calls require_disposable_kube_context after "
                f"the first mutating kubectl command on line {first_mutation}"
            )
    if script.name == "cleanup.sh":
        if mutating_lines:
            fail(f"{slug}/cleanup.sh should use guarded cleanup helpers instead of raw mutating kubectl")
        if "No cleanup needed" not in content and not uses_guarded_cleanup:
            fail(f"{slug}/cleanup.sh should either use guarded namespace cleanup or clearly state that no cleanup is needed")



def verify_artifact_paths(slug: str, lab_dir: Path, lab: dict) -> None:
    artifact_paths = lab.get("artifact_paths", [])
    if not artifact_paths:
        fail(f"{slug} has no artifact_paths")
    if len(artifact_paths) != len(set(artifact_paths)):
        fail(f"{slug} has duplicate artifact_paths")

    artifact_set = set(artifact_paths)
    required_paths = {repo_relative(lab_dir / filename) for filename in REQUIRED_LAB_FILES}
    missing_required = sorted(required_paths - artifact_set)
    if missing_required:
        fail(f"{slug} artifact_paths missing required files: {missing_required}")
    learner_artifacts = learner_artifact_paths(lab)
    if not learner_artifacts:
        fail(f"{slug} has no learner artifact paths")
    if any(path.endswith("/solution.md") or path.endswith("/README.md") for path in learner_artifacts):
        fail(f"{slug} learner artifact paths include source-only files")
    if not set(learner_artifacts).issubset(artifact_set):
        fail(f"{slug} learner artifact paths must be a subset of artifact_paths")

    for artifact_path in artifact_paths:
        path = Path(artifact_path)
        if path.is_absolute() or ".." in path.parts:
            fail(f"{slug} has unsafe artifact path: {artifact_path}")
        source = REPO_ROOT / path
        if not source.is_file():
            fail(f"{slug} artifact does not exist: {artifact_path}")
        if git_ignored(artifact_path):
            fail(f"{slug} artifact is ignored by .gitignore: {artifact_path}")
        if source.stat().st_size == 0:
            fail(f"{slug} artifact is empty: {artifact_path}")
        if source.name in {"validate.sh", "cleanup.sh", "setup.sh"} and not executable(source):
            fail(f"{slug} script artifact is not executable: {artifact_path}")
        if artifact_path.startswith("labs/platform-academy/"):
            lab_prefix = f"labs/platform-academy/{slug}/"
            shared_paths = {
                "labs/platform-academy/simulator.py",
                "labs/platform-academy/lib/cluster-safety.sh",
                "labs/platform-academy/lib/evidence-check.sh",
            }
            if not artifact_path.startswith(lab_prefix) and artifact_path not in shared_paths:
                fail(f"{slug} artifact points outside its lab folder: {artifact_path}")


def verify_metadata_contract(slug: str, lab: dict) -> None:
    required_list_fields = [
        "prerequisites",
        "setup_commands",
        "commands",
        "practice_steps",
        "expected_evidence",
        "validation_commands",
        "cleanup_commands",
        "no_cluster_fallback",
        "worksheet_prompts",
        "rubric",
        "validation_checks",
        "checklist",
    ]
    for field in required_list_fields:
        value = lab.get(field)
        if not isinstance(value, list) or not value:
            fail(f"{slug} metadata field {field} must be a non-empty list")

    if len(lab["worksheet_prompts"]) < 4:
        fail(f"{slug} should expose at least four worksheet prompts")
    if len(lab["rubric"]) < 4:
        fail(f"{slug} should expose at least four rubric items")
    if len(lab["validation_checks"]) < 5:
        fail(f"{slug} should expose at least five validation checks")
    if not any(f"labs/platform-academy/{slug}/validate.sh" in command for command in lab["validation_commands"]):
        fail(f"{slug} validation_commands must include its validate.sh")
    if not any(f"labs/platform-academy/{slug}/cleanup.sh" in command for command in lab["cleanup_commands"]):
        fail(f"{slug} cleanup_commands must include its cleanup.sh")

    command_like_values: list[str] = []
    for field in ["setup_commands", "commands", "validation_commands", "cleanup_commands", "no_cluster_fallback"]:
        command_like_values.extend(str(value) for value in lab[field])
    for referenced_path in referenced_repo_paths(command_like_values):
        if not (REPO_ROOT / referenced_path).exists():
            fail(f"{slug} references missing repo path in metadata: {referenced_path}")


def verify_portfolio_metadata_contract(full_labs: list[dict]) -> None:
    full_slugs = {lab["slug"] for lab in full_labs}
    if len(PORTFOLIO_LAB_SLUGS) != EXPECTED_PORTFOLIO_LAB_COUNT:
        fail(f"expected {EXPECTED_PORTFOLIO_LAB_COUNT} portfolio-grade lab slugs, got {len(PORTFOLIO_LAB_SLUGS)}")
    if not set(PORTFOLIO_LAB_SLUGS).issubset(full_slugs):
        fail(f"portfolio-grade lab slugs must be full labs: {sorted(set(PORTFOLIO_LAB_SLUGS) - full_slugs)}")
    if set(PORTFOLIO_LAB_FOCUS) != set(PORTFOLIO_LAB_SLUGS):
        missing = sorted(set(PORTFOLIO_LAB_SLUGS) - set(PORTFOLIO_LAB_FOCUS))
        extra = sorted(set(PORTFOLIO_LAB_FOCUS) - set(PORTFOLIO_LAB_SLUGS))
        fail(f"portfolio focus map mismatch; missing={missing}, extra={extra}")

    portfolio_slugs_from_labs = {lab["slug"] for lab in full_labs if lab.get("portfolio_grade") is True}
    if portfolio_slugs_from_labs != set(PORTFOLIO_LAB_SLUGS):
        missing = sorted(set(PORTFOLIO_LAB_SLUGS) - portfolio_slugs_from_labs)
        extra = sorted(portfolio_slugs_from_labs - set(PORTFOLIO_LAB_SLUGS))
        fail(f"portfolio-grade catalog metadata mismatch; missing={missing}, extra={extra}")

    for lab in full_labs:
        slug = lab["slug"]
        expected_focus = PORTFOLIO_LAB_FOCUS.get(slug, "")
        actual_focus = lab.get("portfolio_focus", "")
        if slug in PORTFOLIO_LAB_SLUGS:
            if actual_focus != expected_focus:
                fail(f"{slug} portfolio_focus should be {expected_focus!r}, got {actual_focus!r}")
        elif lab.get("portfolio_grade") is True or actual_focus:
            fail(f"{slug} should not expose portfolio-grade metadata")


def verify_deepened_lab_contract(slug: str, lab_dir: Path, lab: dict) -> None:
    contract = DEEPENED_LAB_CONTRACT.get(slug)
    if not contract:
        return

    artifact_paths = set(lab.get("artifact_paths", []))
    required_artifacts = {repo_relative(lab_dir / filename) for filename in contract["files"]}
    missing_artifacts = sorted(required_artifacts - artifact_paths)
    if missing_artifacts:
        fail(f"{slug} deepened lab artifact_paths missing files: {missing_artifacts}")

    for filename in contract["files"]:
        path = lab_dir / filename
        if not path.is_file():
            fail(f"{slug} deepened lab file missing: {filename}")
        content = path.read_text()
        if "Evidence" not in content:
            fail(f"{slug}/{filename} should be evidence-oriented")

    if len(lab.get("worksheet_prompts", [])) < 6:
        fail(f"{slug} deepened lab should expose at least six worksheet prompts")
    if len(lab.get("rubric", [])) < 6:
        fail(f"{slug} deepened lab should expose at least six rubric items")
    if len(lab.get("validation_checks", [])) < 7:
        fail(f"{slug} deepened lab should expose at least seven validation checks")

    evidence_terms = lab.get("rubric_evidence_terms")
    if not isinstance(evidence_terms, list) or len(evidence_terms) != len(lab.get("rubric", [])):
        fail(f"{slug} deepened lab rubric_evidence_terms must match rubric length")
    for index, terms in enumerate(evidence_terms):
        if not isinstance(terms, list) or not terms or not all(isinstance(term, str) and term.strip() for term in terms):
            fail(f"{slug} deepened lab rubric_evidence_terms[{index}] must be a non-empty string list")

    searchable_metadata = "\n".join(
        str(item)
        for field in ["worksheet_prompts", "rubric", "validation_checks", "rubric_evidence_terms"]
        for item in lab.get(field, [])
    )
    missing_terms = sorted(term for term in contract["terms"] if term not in searchable_metadata)
    if missing_terms:
        fail(f"{slug} deepened lab metadata missing terms: {missing_terms}")


def verify_contract() -> list[str]:
    verify_unique_slugs()
    full_labs = full_labs_in_catalog_order()
    full_slugs = {lab["slug"] for lab in full_labs}
    if full_slugs != set(FULL_LAB_SLUGS):
        fail(f"FULL_LAB_SLUGS does not match full catalog labs: {sorted(full_slugs ^ set(FULL_LAB_SLUGS))}")
    if set(LAB_ARTIFACT_PATHS) != full_slugs:
        missing = sorted(full_slugs - set(LAB_ARTIFACT_PATHS))
        extra = sorted(set(LAB_ARTIFACT_PATHS) - full_slugs)
        fail(f"LAB_ARTIFACT_PATHS keys mismatch full labs; missing={missing}, extra={extra}")
    if set(DEEPENED_LAB_CONTRACT) != full_slugs:
        missing = sorted(full_slugs - set(DEEPENED_LAB_CONTRACT))
        extra = sorted(set(DEEPENED_LAB_CONTRACT) - full_slugs)
        fail(f"DEEPENED_LAB_CONTRACT must cover every full lab; missing={missing}, extra={extra}")

    verify_lab_directory_inventory(full_slugs)
    verify_root_readme_contract(full_slugs)
    verify_platform_lab_docs_contract()
    verify_portfolio_metadata_contract(full_labs)

    for lab in full_labs:
        slug = lab["slug"]
        lab_dir = LAB_ROOT / slug
        verify_metadata_contract(slug, lab)
        verify_artifact_paths(slug, lab_dir, lab)
        verify_readme_contract(slug, lab_dir / "README.md")
        verify_solution_contract(slug, lab_dir / "solution.md")
        verify_deepened_lab_contract(slug, lab_dir, lab)
        artifacts = set(lab["artifact_paths"])
        script_names = ["validate.sh", "cleanup.sh"]
        if (lab_dir / "setup.sh").is_file():
            script_names.append("setup.sh")
        for script_name in script_names:
            verify_script_contract(slug, lab_dir / script_name, artifacts)

    return [lab["slug"] for lab in full_labs]


def full_lab_by_slug(slug: str) -> dict | None:
    for lab in full_labs_in_catalog_order():
        if lab["slug"] == slug:
            return lab
    return None


def print_lab_summary(lab: dict) -> None:
    def print_items(title: str, items: Iterable[str]) -> None:
        values = [str(item) for item in items if str(item).strip()]
        if not values:
            return
        print(f"\n{title}:")
        for item in values:
            print(f"  - {item}")

    slug = lab["slug"]
    evidence_templates = [path for path in lab.get("artifact_paths", []) if path.endswith("/evidence-template.md")]
    print(f"Lab: {lab['title']}")
    print(f"Slug: {slug}")
    print(f"Track: {lab['track']}")
    print(f"Tier: {lab.get('lab_tier', 'guided')}")
    print(f"Estimated: {lab['estimated_minutes']} minutes")
    print(f"Scenario: {lab['scenario']}")
    print_items("Prerequisites", lab.get("prerequisites", []))
    print_items("Setup commands", lab.get("setup_commands", []))
    print_items("Practice commands", lab.get("commands", []))
    print_items("Validation commands", lab.get("validation_commands", []))
    print_items("Cleanup commands", lab.get("cleanup_commands", []))
    print_items("Evidence templates", evidence_templates)
    print_items("No-cluster fallback", lab.get("no_cluster_fallback", []))
    print(f"\nArtifact bundle endpoint: /api/platform-academy/labs/{slug}/bundle")
    print(f"Local setup: bash labs/platform-academy/run-lab.sh setup {slug}")
    print(f"Local validate: bash labs/platform-academy/run-lab.sh validate {slug}")
    print(f"Local cleanup: bash labs/platform-academy/run-lab.sh cleanup {slug}")


def lab_review_mode(lab: dict) -> str:
    slug = lab["slug"]
    artifact_paths = lab.get("artifact_paths", [])
    if f"labs/platform-academy/{slug}/setup.sh" in artifact_paths:
        return "local cluster-capable"
    if any(path.endswith((".yaml", ".yml", ".json", ".txt", ".log", ".csv")) for path in artifact_paths):
        return "captured evidence"
    return "design/review packet"


def print_lab_review_matrix() -> None:
    labs = full_labs_in_catalog_order()
    print("# Platform Academy Lab Review Matrix")
    print()
    print("| Lab | Portfolio focus | Structural gate | Mode | Track | Time | Learner files | Source files | Evidence self-check |")
    print("| --- | --- | --- | --- | --- | ---: | ---: | ---: | --- |")
    for lab in labs:
        slug = lab["slug"]
        learner_count = len(learner_artifact_paths(lab))
        source_count = len(lab.get("artifact_paths", []))
        evidence_check = "yes" if any("--evidence" in command for command in lab.get("validation_commands", [])) else "no"
        portfolio_focus = lab.get("portfolio_focus") or "-"
        structural_gate = "yes" if lab.get("portfolio_grade") else "-"
        print(
            f"| `{slug}` | {portfolio_focus} | {structural_gate} | {lab_review_mode(lab)} | {lab['track']} | "
            f"{lab['estimated_minutes']}m | {learner_count} | {source_count} | {evidence_check} |"
        )
    print()
    print("All rows are verified by `make platform-lab-contract` before this matrix prints.")
    print(
        "Rows with `Structural gate` set to `yes` are also parsed by "
        "`make platform-lab-artifact-contract` for portfolio-grade YAML/JSON contracts."
    )
    print(
        "Learner files exclude source-only `README.md` and `solution.md`; "
        "source files are protected by the instructor/source bundle token outside local/test/development."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--list-full-lab-slugs",
        action="store_true",
        help="print full lab slugs in API catalog order after contract validation",
    )
    parser.add_argument(
        "--skip-contract",
        action="store_true",
        help="skip full contract validation after an upstream verifier has already passed",
    )
    parser.add_argument(
        "--show-lab",
        metavar="SLUG",
        help="print a runnable summary for one full lab after contract validation",
    )
    parser.add_argument(
        "--lab-review-matrix",
        action="store_true",
        help="print a Markdown review matrix for all full labs after contract validation",
    )
    parser.add_argument(
        "--lab-packet",
        metavar="SLUG",
        help="print a Markdown lab packet for one full lab after contract validation",
    )
    parser.add_argument(
        "--write-workspace",
        metavar="SLUG",
        help="write a learner workspace for one full lab after contract validation",
    )
    parser.add_argument(
        "--workspace-dir",
        default="/tmp/platform-academy-workspaces",
        help="directory under which --write-workspace creates <lab-slug>",
    )
    parser.add_argument(
        "--include-solution",
        action="store_true",
        help="include solution.md in the generated learner workspace",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="replace an existing non-empty learner workspace",
    )
    args = parser.parse_args()

    try:
        if args.skip_contract:
            slugs = [lab["slug"] for lab in full_labs_in_catalog_order()]
        else:
            slugs = verify_contract()
    except ContractFailure as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1

    selected_slug = args.show_lab or args.lab_packet or args.write_workspace
    if selected_slug:
        lab = full_lab_by_slug(selected_slug)
        if lab is None:
            print(f"FAIL: unknown full lab slug: {selected_slug}", file=sys.stderr)
            return 1
        if args.show_lab:
            print_lab_summary(lab)
        elif args.lab_packet:
            print(lab_packet_markdown(lab), end="")
        else:
            try:
                destination = write_lab_workspace(
                    lab,
                    REPO_ROOT,
                    Path(args.workspace_dir),
                    include_solution=args.include_solution,
                    force=args.force,
                )
            except LabArtifactError as exc:
                print(f"FAIL: {exc}", file=sys.stderr)
                return 1
            print(f"Wrote learner workspace: {destination}")
    elif args.lab_review_matrix:
        print_lab_review_matrix()
    elif args.list_full_lab_slugs:
        print("\n".join(slugs))
    else:
        print(f"Verified Platform Academy lab contract for {len(slugs)} full labs.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
