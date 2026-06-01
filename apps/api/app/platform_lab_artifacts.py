from __future__ import annotations

import re
import shutil
import stat
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from zipfile import ZipFile, ZipInfo


class LabArtifactError(Exception):
    """Raised when a lab artifact cannot be safely materialized."""


LAB_WORKSPACE_SCRIPT_NAMES = ("setup.sh", "validate.sh", "cleanup.sh")


@dataclass(frozen=True)
class WorkspaceArtifactSelection:
    copied_artifacts: list[str]
    withheld_artifacts: list[str]


def learner_artifact_paths(lab: dict) -> list[str]:
    return [
        path
        for path in lab.get("artifact_paths", [])
        if not path.endswith("/solution.md") and not path.endswith("/README.md")
    ]


def source_artifact_paths(lab: dict) -> list[str]:
    return list(lab.get("artifact_paths", []))


def source_bundle_manifest(lab: dict) -> str:
    slug = lab["slug"]
    lines = [
        f"Platform Academy instructor/source bundle: {slug}",
        "",
        "Files:",
        "- README.md: generated learner lab packet.",
        "- SOURCE-MANIFEST.txt: this manifest.",
        "Complete repo-backed lab source artifacts are listed below.",
        "",
        "Source artifacts:",
        *[f"- {artifact}" for artifact in source_artifact_paths(lab)],
    ]
    return "\n".join(lines) + "\n"


def write_source_bundle_archive(archive: ZipFile, lab: dict, repo_root: Path) -> None:
    slug = lab["slug"]
    archive.writestr(f"{slug}/README.md", lab_packet_markdown(lab))
    archive.writestr(f"{slug}/SOURCE-MANIFEST.txt", source_bundle_manifest(lab))
    for artifact_path in source_artifact_paths(lab):
        source = safe_source_path(repo_root, artifact_path)
        archive.write(source, f"{slug}/{artifact_path}")


def _markdown_section(title: str, items: Iterable[str] | None, checklist: bool = False) -> str:
    values = [str(item) for item in items or [] if str(item).strip()]
    if not values:
        return ""
    prefix = "- [ ]" if checklist else "-"
    return f"\n## {title}\n\n" + "\n".join(f"{prefix} {item}" for item in values) + "\n"


def _compact_items(items: Iterable[str] | None, limit: int = 4) -> list[str]:
    return [str(item) for item in items or [] if str(item).strip()][:limit]


def _artifact_role(path: str) -> str:
    lower = path.lower()
    if lower.endswith("evidence-template.md"):
        return "Evidence template"
    if lower.endswith("validate.sh"):
        return "Self-check script"
    if lower.endswith("cleanup.sh"):
        return "Cleanup script"
    if any(marker in lower for marker in ["fixed", "safe", "ready", "completed"]):
        return "Target artifact"
    if any(marker in lower for marker in ["start", "broken", "live", "snapshot", "report"]):
        return "Starting evidence"
    if any(marker in lower for marker in ["event", "log", "cloudtrail", "tfplan"]):
        return "Captured evidence"
    if lower.endswith((".yaml", ".yml", ".json")):
        return "Manifest"
    if lower.endswith(".md"):
        return "Decision note"
    return "Lab artifact"


def _guided_run_sequence(lab: dict) -> str:
    phases = [
        (
            "Prepare workspace",
            [*lab.get("prerequisites", []), *lab.get("setup_commands", [])],
            "No setup step is required before opening the evidence.",
        ),
        (
            "Investigate safely",
            [*lab.get("practice_steps", []), *lab.get("commands", [])],
            "Use the worksheet prompts as the investigation path.",
        ),
        (
            "Prove the finding",
            [*lab.get("expected_evidence", []), *lab.get("validation_commands", [])],
            "Save worksheet evidence before marking the lab complete.",
        ),
        (
            "Reset or hand off",
            [*lab.get("cleanup_commands", []), *lab.get("no_cluster_fallback", [])],
            "Record cleanup or no-runtime evidence in the workbook.",
        ),
    ]
    lines = ["", "## Guided run sequence", ""]
    for index, (title, items, empty_text) in enumerate(phases, start=1):
        lines.append(f"{index}. {title}")
        values = _compact_items(items)
        if values:
            lines.extend(f"   - {item}" for item in values)
        else:
            lines.append(f"   - {empty_text}")
    return "\n".join(lines) + "\n"


def _artifact_map(lab: dict) -> str:
    artifacts = learner_artifact_paths(lab)
    if not artifacts:
        return ""
    lines = ["", "## Evidence artifact map", ""]
    for artifact in artifacts:
        lines.append(f"- `{artifact}` - {_artifact_role(artifact)}")
    return "\n".join(lines) + "\n"


def lab_packet_markdown(lab: dict) -> str:
    return (
        f"# {lab['title']}\n\n"
        f"Track: {lab['track']}\n"
        f"Level: {lab['difficulty']}\n"
        f"Lab tier: {lab.get('lab_tier', 'guided')}\n"
        f"Estimated time: {lab['estimated_minutes']} minutes\n\n"
        f"## Scenario\n\n{lab['scenario']}\n"
        + _guided_run_sequence(lab)
        + _artifact_map(lab)
        + _markdown_section("Learner artifact paths", learner_artifact_paths(lab))
        + _markdown_section("Worksheet prompts", lab.get("worksheet_prompts"), True)
        + _markdown_section("Prerequisites", lab.get("prerequisites"), True)
        + _markdown_section("Setup commands", lab.get("setup_commands"))
        + _markdown_section(
            "Local workspace",
            [f"bash labs/platform-academy/run-lab.sh workspace {lab['slug']} --dir /tmp/platform-academy-workspaces"],
        )
        + _markdown_section("Practice steps", lab.get("practice_steps"), True)
        + _markdown_section("Runbook commands", lab.get("commands"))
        + _markdown_section("Expected evidence", lab.get("expected_evidence"), True)
        + _markdown_section("Validation commands", lab.get("validation_commands"))
        + _markdown_section("Validation checks", lab.get("validation_checks"), True)
        + _markdown_section("Rubric", lab.get("rubric"), True)
        + _markdown_section("Cleanup commands", lab.get("cleanup_commands"))
        + _markdown_section("No-cluster fallback", lab.get("no_cluster_fallback"), True)
    )


def workspace_script_text(slug: str, script_name: str) -> str:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise LabArtifactError(f"invalid lab slug for workspace script: {slug}")

    if script_name == "setup.sh":
        return f"""#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${{BASH_SOURCE[0]}}")" && pwd)"
TEMPLATE="$DIR/artifacts/labs/platform-academy/{slug}/evidence-template.md"

if [[ -s "$DIR/evidence.md" ]]; then
  echo "Evidence note already exists: $DIR/evidence.md"
elif [[ -f "$TEMPLATE" ]]; then
  cp "$TEMPLATE" "$DIR/evidence.md"
  echo "Created evidence note: $DIR/evidence.md"
else
  echo "No evidence template found for {slug}; create $DIR/evidence.md before validation." >&2
  exit 1
fi

echo
echo "Next:"
echo "  Edit evidence.md with your investigation notes."
echo "  ./validate.sh --files-only"
echo "  ./validate.sh"
"""

    if script_name == "validate.sh":
        return f"""#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${{BASH_SOURCE[0]}}")" && pwd)"
TARGET="$DIR/artifacts/labs/platform-academy/{slug}/validate.sh"

if [[ ! -f "$TARGET" ]]; then
  echo "FAIL: copied validator is missing: $TARGET" >&2
  exit 1
fi

use_default_evidence=true
for arg in "$@"; do
  case "$arg" in
    --files-only|--evidence)
      use_default_evidence=false
      ;;
  esac
done

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --files-only)
      shift
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

if [[ "$use_default_evidence" == true ]]; then
  args=("--evidence" "$DIR/evidence.md" "${{args[@]}}")
fi

bash "$TARGET" "${{args[@]}}"
"""

    if script_name == "cleanup.sh":
        return f"""#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "${{BASH_SOURCE[0]}}")" && pwd)"
TARGET="$DIR/artifacts/labs/platform-academy/{slug}/cleanup.sh"

if [[ ! -f "$TARGET" ]]; then
  echo "FAIL: copied cleanup script is missing: $TARGET" >&2
  exit 1
fi

bash "$TARGET" "$@"
"""

    raise LabArtifactError(f"unknown workspace script requested: {script_name}")


def write_executable_archive_text(archive: ZipFile, member_name: str, content: str) -> None:
    info = ZipInfo(member_name)
    info.external_attr = 0o755 << 16
    archive.writestr(info, content)


def write_workspace_script(destination: Path, slug: str, script_name: str) -> None:
    script_path = destination / script_name
    script_path.write_text(workspace_script_text(slug, script_name), encoding="utf-8")
    script_path.chmod(script_path.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


def withheld_source_artifacts(lab: dict) -> list[str]:
    learner_artifacts = set(learner_artifact_paths(lab))
    return [artifact for artifact in source_artifact_paths(lab) if artifact not in learner_artifacts]


def selected_workspace_artifacts(lab: dict, include_solution: bool = False) -> WorkspaceArtifactSelection:
    if include_solution:
        return WorkspaceArtifactSelection(copied_artifacts=source_artifact_paths(lab), withheld_artifacts=[])
    learner_artifacts = set(learner_artifact_paths(lab))
    copied = [artifact for artifact in source_artifact_paths(lab) if artifact in learner_artifacts]
    return WorkspaceArtifactSelection(copied_artifacts=copied, withheld_artifacts=withheld_source_artifacts(lab))


def safe_source_path(repo_root: Path, artifact_path: str) -> Path:
    path = Path(artifact_path)
    if path.is_absolute() or ".." in path.parts:
        raise LabArtifactError(f"unsafe lab artifact path: {artifact_path}")
    root = repo_root.resolve()
    source = (root / path).resolve()
    try:
        source.relative_to(root)
    except ValueError as exc:
        raise LabArtifactError(f"unsafe lab artifact path: {artifact_path}") from exc
    if not source.is_file():
        raise LabArtifactError(f"lab artifact missing: {artifact_path}")
    return source


def learner_workspace_manifest(
    lab: dict,
    copied_artifacts: list[str],
    withheld_artifacts: list[str],
    repo_validation_evidence_path: str | None = None,
    withheld_hint: str = "Pass --include-solution when you intentionally want the answer key in this workspace.",
) -> str:
    slug = lab["slug"]
    evidence_path = repo_validation_evidence_path or f"/tmp/{slug}-evidence.md"
    lines = [
        f"Platform Academy learner workspace: {slug}",
        "",
        "Files:",
        "- README.md: lab packet with run sequence, artifact map, prompts, commands, validation checks, and rubric.",
        "- evidence.md: learner evidence note copied from the lab evidence template.",
        "- setup.sh: local helper that creates evidence.md when needed.",
        "- validate.sh: local helper that validates copied artifacts and evidence.md.",
        "- cleanup.sh: local helper that runs the copied cleanup script.",
        "- artifacts/: copied repo-backed lab artifacts for local inspection.",
        "",
        "Quick start:",
        "- ./setup.sh",
        "- Edit evidence.md with your investigation notes.",
        "- ./validate.sh --files-only",
        "- ./validate.sh",
        "- ./cleanup.sh",
        "",
        "Repo validation:",
        f"- bash labs/platform-academy/run-lab.sh validate {slug} --evidence {evidence_path}",
        "",
        "Copied artifacts:",
        *[f"- {artifact}" for artifact in copied_artifacts],
    ]
    if withheld_artifacts:
        lines.extend([
            "",
            "Withheld source-only artifacts:",
            *[f"- {artifact}" for artifact in withheld_artifacts],
            "",
            withheld_hint,
        ])
    return "\n".join(lines) + "\n"


def write_lab_workspace(
    lab: dict,
    repo_root: Path,
    workspace_dir: Path,
    include_solution: bool = False,
    force: bool = False,
) -> Path:
    slug = lab["slug"]
    destination = (workspace_dir / slug).expanduser()
    if destination.exists():
        if force:
            shutil.rmtree(destination)
        elif any(destination.iterdir()):
            raise LabArtifactError(f"{destination} already exists and is not empty; pass --force to replace it")

    destination.mkdir(parents=True, exist_ok=True)
    (destination / "README.md").write_text(lab_packet_markdown(lab), encoding="utf-8")

    evidence_template = repo_root / "labs" / "platform-academy" / slug / "evidence-template.md"
    if evidence_template.is_file():
        shutil.copy2(evidence_template, destination / "evidence.md")

    artifacts_dir = destination / "artifacts"
    selection = selected_workspace_artifacts(lab, include_solution=include_solution)
    for artifact_path in selection.copied_artifacts:
        source = safe_source_path(repo_root, artifact_path)
        target = artifacts_dir / artifact_path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    for script_name in LAB_WORKSPACE_SCRIPT_NAMES:
        write_workspace_script(destination, slug, script_name)

    evidence_path = destination / "evidence.md"
    (destination / "MANIFEST.txt").write_text(
        learner_workspace_manifest(
            lab,
            selection.copied_artifacts,
            selection.withheld_artifacts,
            repo_validation_evidence_path=str(evidence_path.resolve()),
        ),
        encoding="utf-8",
    )

    return destination


def write_learner_workspace_archive(archive: ZipFile, lab: dict, repo_root: Path) -> WorkspaceArtifactSelection:
    slug = lab["slug"]
    archive.writestr(f"{slug}/README.md", lab_packet_markdown(lab))
    for script_name in LAB_WORKSPACE_SCRIPT_NAMES:
        write_executable_archive_text(archive, f"{slug}/{script_name}", workspace_script_text(slug, script_name))

    evidence_template_path = f"labs/platform-academy/{slug}/evidence-template.md"
    evidence_source = safe_source_path(repo_root, evidence_template_path)
    archive.write(evidence_source, f"{slug}/evidence.md")

    selection = selected_workspace_artifacts(lab, include_solution=False)
    for artifact_path in selection.copied_artifacts:
        source = safe_source_path(repo_root, artifact_path)
        archive.write(source, f"{slug}/artifacts/{artifact_path}")

    archive.writestr(
        f"{slug}/MANIFEST.txt",
        learner_workspace_manifest(
            lab,
            selection.copied_artifacts,
            selection.withheld_artifacts,
            withheld_hint="Use the full instructor/source bundle only when you intentionally need the answer key.",
        ),
    )
    return selection
