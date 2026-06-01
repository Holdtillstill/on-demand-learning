#!/usr/bin/env python3
"""Export learner-safe Platform Academy API snapshots for static hosting."""

from __future__ import annotations

import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API_ROOT = ROOT / "apps" / "api"
PUBLIC_ROOT = ROOT / "apps" / "platform-academy" / "public"
STATIC_ROOT = PUBLIC_ROOT / "static-api"
API_MIRROR_ROOT = PUBLIC_ROOT / "api"

sys.path.insert(0, str(API_ROOT))


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=True, separators=(",", ":")) + "\n", encoding="utf-8")


def write_api_json(api_path: str, payload: object) -> None:
    write_json(PUBLIC_ROOT / api_path.lstrip("/"), payload)


def require_ok(response, source_path: str):
    if response.status_code != 200:
        raise RuntimeError(f"{source_path} returned {response.status_code}: {response.text[:300]}")
    return response


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="platform-academy-static-api-") as tmpdir:
        os.environ["DATABASE_URL"] = os.environ.get("PLATFORM_STATIC_EXPORT_DATABASE_URL", f"sqlite:///{Path(tmpdir) / 'export.db'}")
        os.environ.setdefault("ENVIRONMENT", "test")
        os.environ.setdefault("OTEL_EXPORTER_OTLP_ENDPOINT", "")
        os.environ.setdefault("RATE_LIMIT_PER_MINUTE", "0")
        os.environ.setdefault("PLATFORM_SOURCE_BUNDLE_PUBLIC", "true")

        from fastapi.testclient import TestClient

        from app.main import app

        if STATIC_ROOT.exists():
            shutil.rmtree(STATIC_ROOT)
        for api_child in ("platform-academy", "lessons"):
            api_path = API_MIRROR_ROOT / api_child
            if api_path.exists():
                shutil.rmtree(api_path)
        STATIC_ROOT.mkdir(parents=True)

        exported_lessons = 0
        exported_labs = 0

        with TestClient(app) as client:
            endpoint_map = {
                "/api/platform-academy/catalog": STATIC_ROOT / "platform-academy-catalog.json",
                "/api/platform-academy/roadmap": STATIC_ROOT / "platform-academy-roadmap.json",
                "/api/platform-academy/resources": STATIC_ROOT / "platform-academy-resources.json",
                "/api/platform-academy/interview-prep": STATIC_ROOT / "platform-academy-interview-prep.json",
                "/api/platform-academy/labs": STATIC_ROOT / "platform-academy-labs.json",
            }
            payloads: dict[str, object] = {}
            for api_path, output_path in endpoint_map.items():
                response = require_ok(client.get(api_path), api_path)
                payload = response.json()
                payloads[api_path] = payload
                write_json(output_path, payload)
                write_api_json(api_path, payload)

            catalog = payloads["/api/platform-academy/catalog"]
            lesson_ids = sorted(
                {
                    int(lesson["id"])
                    for level in catalog["levels"]
                    for course in level["courses"]
                    for lesson in course["lessons"]
                }
            )
            for lesson_id in lesson_ids:
                api_path = f"/api/lessons/{lesson_id}"
                response = require_ok(client.get(api_path), api_path)
                payload = response.json()
                write_json(STATIC_ROOT / "lessons" / f"{lesson_id}.json", payload)
                write_api_json(api_path, payload)
                exported_lessons += 1

            labs = payloads["/api/platform-academy/labs"]
            for lab in labs:
                slug = str(lab["slug"])
                lab_dir = STATIC_ROOT / "labs" / slug
                packet_path = f"/api/platform-academy/labs/{slug}/packet"
                packet_response = require_ok(client.get(packet_path), packet_path)
                lab_dir.mkdir(parents=True, exist_ok=True)
                (lab_dir / "packet.md").write_text(packet_response.text, encoding="utf-8")

                workspace_path = f"/api/platform-academy/labs/{slug}/workspace-bundle"
                workspace_response = require_ok(client.get(workspace_path), workspace_path)
                (lab_dir / "workspace-bundle.zip").write_bytes(workspace_response.content)
                exported_labs += 1

        write_json(
            STATIC_ROOT / "manifest.json",
            {
                "schema_version": 1,
                "source": "Platform Academy public static API snapshot",
                "lessons": exported_lessons,
                "labs": exported_labs,
                "files": sorted(str(path.relative_to(STATIC_ROOT)) for path in STATIC_ROOT.rglob("*") if path.is_file()),
            },
        )
        print(f"Exported {exported_lessons} lessons and {exported_labs} labs to {STATIC_ROOT}")


if __name__ == "__main__":
    main()
