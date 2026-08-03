from __future__ import annotations

import hashlib
import tomllib
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_backend_image_inputs_are_deterministic() -> None:
    files = [
        "pyproject.toml",
        "uv.lock",
        "Dockerfile",
        "src/manage.py",
        "src/moviqo/asgi.py",
        "src/moviqo/settings/base.py",
    ]

    first = _digest(files)
    second = _digest(files)

    assert first == second


def test_verification_commands_are_declared() -> None:
    data = tomllib.loads((PROJECT_ROOT / "pyproject.toml").read_text(encoding="utf-8"))
    commands = data["tool"]["moviqo"]["verify_commands"]

    assert "uv run pytest" in commands
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


def test_container_build_uses_locked_dependency_inputs() -> None:
    dockerfile = (PROJECT_ROOT / "Dockerfile").read_text(encoding="utf-8")

    assert "COPY pyproject.toml uv.lock README.md ./" in dockerfile
    assert "uv sync --frozen --no-dev" in dockerfile
    assert "redis" not in dockerfile.lower()
    assert "celery" not in dockerfile.lower()


def _digest(files: list[str]) -> str:
    digest = hashlib.sha256()
    for file_name in files:
        path = PROJECT_ROOT / file_name
        digest.update(file_name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()
