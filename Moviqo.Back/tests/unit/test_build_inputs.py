from __future__ import annotations

import hashlib
import tomllib
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SRC_ROOT = PROJECT_ROOT / "src"


def test_backend_image_inputs_are_deterministic() -> None:
    files = _backend_image_inputs()

    first = _digest(files)
    second = _digest(list(reversed(files)))

    assert first == second


def test_backend_image_inputs_include_copied_source_tree() -> None:
    files = set(_backend_image_inputs())
    source_files = {
        path.relative_to(PROJECT_ROOT).as_posix()
        for path in SRC_ROOT.rglob("*")
        if path.is_file()
    }

    assert source_files <= files


def test_verification_commands_are_declared() -> None:
    data = tomllib.loads((PROJECT_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    commands = data["tool"]["moviqo"]["verify_commands"]

    assert "uv run pytest" in commands
    assert (
        "uv run python src/manage.py spectacular --file ../docs/api/openapi-v1.json "
        "--format openapi-json --validate --fail-on-warn --settings=moviqo.settings.test"
        in commands
    )
    assert "git -C .. ls-files --error-unmatch docs/api/openapi-v1.json" in commands
    assert "git -C .. diff --exit-code -- docs/api/openapi-v1.json" in commands
    assert (
        "uv run python src/manage.py check --deploy --settings=moviqo.settings.production"
        in commands
    )
    assert "uv run python src/manage.py health_start" in commands
    assert (
        "uv run python src/manage.py makemigrations --settings=moviqo.settings.test "
        "--check --dry-run"
        in commands
    )
    assert (
        "uv run python src/manage.py migrate --settings=moviqo.settings.test --noinput"
        in commands
    )
    assert "uv run pytest tests/integration --ds=moviqo.settings.integration" in commands


def test_local_integration_hosts_support_vite_origins_and_ipv4_database() -> None:
    environment_script = (PROJECT_ROOT / "scripts" / "use-integration-env.ps1").read_text(
        encoding="utf-8"
    )
    integration_settings = (
        PROJECT_ROOT / "src" / "moviqo" / "settings" / "integration.py"
    ).read_text(encoding="utf-8")

    expected_hosts = "localhost,127.0.0.1,testserver"
    for contract in (environment_script, integration_settings):
        assert expected_hosts in contract
        assert 'MOVIQO_DB_HOST", "127.0.0.1"' in contract or (
            'MOVIQO_DB_HOST = "127.0.0.1"' in contract
        )


def test_container_build_uses_locked_dependency_inputs() -> None:
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text(encoding="utf-8")

    assert "COPY pyproject.toml uv.lock README.md ./" in dockerfile
    assert "uv sync --frozen --no-dev" in dockerfile
    assert "redis" not in dockerfile.lower()
    assert "celery" not in dockerfile.lower()


def test_secret_files_are_excluded_from_git_and_docker_contexts() -> None:
    for ignore_file in [".gitignore", ".dockerignore"]:
        patterns = (PROJECT_ROOT / ignore_file).read_text(encoding="utf-8").splitlines()
        assert ".env" in patterns
        assert ".env.*" in patterns
        assert "*.pem" in patterns
        assert "*.key" in patterns


def _backend_image_inputs() -> list[str]:
    explicit_inputs = ["Dockerfile", "README.md", "pyproject.toml", "uv.lock"]
    source_inputs = [
        path.relative_to(PROJECT_ROOT).as_posix()
        for path in SRC_ROOT.rglob("*")
        if path.is_file()
    ]
    return sorted([*explicit_inputs, *source_inputs])


def _digest(files: list[str]) -> str:
    digest = hashlib.sha256()
    for file_name in sorted(files):
        path = PROJECT_ROOT / file_name
        digest.update(file_name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()
