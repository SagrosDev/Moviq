from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest
from django.test import Client

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SCHEMA_PATH = PROJECT_ROOT.parent / "docs" / "api" / "openapi-v1.json"


@pytest.mark.django_db
def test_versioned_openapi_schema_is_served_and_committed() -> None:
    response = Client().get("/api/v1/schema/")

    assert response.status_code == 200
    assert response["Content-Type"].startswith("application/vnd.oai.openapi+json")

    served_schema = response.json()
    committed_schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

    assert served_schema["openapi"].startswith("3.")
    assert served_schema["info"]["title"] == "Moviqo API"
    assert "/api/v1/system/ping/" in served_schema["paths"]
    assert committed_schema == served_schema


def test_schema_generation_command_validates_without_warnings(tmp_path: Path) -> None:
    generated = tmp_path / "openapi-v1.json"

    result = subprocess.run(
        [
            sys.executable,
            "src/manage.py",
            "spectacular",
            "--file",
            str(generated),
            "--format",
            "openapi-json",
            "--validate",
            "--fail-on-warn",
            "--settings=moviqo.settings.test",
        ],
        cwd=PROJECT_ROOT,
        check=False,
        capture_output=True,
        text=True,
    )

    assert result.returncode == 0, result.stderr
    assert json.loads(generated.read_text(encoding="utf-8")) == json.loads(
        SCHEMA_PATH.read_text(encoding="utf-8")
    )


def test_problem_details_component_matches_runtime_shape() -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    problem = schema["components"]["schemas"]["ProblemDetails"]

    assert problem["type"] == "object"
    for field in ["type", "title", "status", "code", "correlationId"]:
        assert field in problem["required"]

    responses = schema["paths"]["/api/v1/system/ping/"]["get"]["responses"]
    assert (
        responses["500"]["content"]["application/problem+json"]["schema"]["$ref"]
        == "#/components/schemas/ProblemDetails"
    )
