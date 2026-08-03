from __future__ import annotations

import ast
import tomllib
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
SRC_ROOT = PROJECT_ROOT / "src"
PYPROJECT = PROJECT_ROOT / "pyproject.toml"

MODULES = {
    "organizations",
    "workflow_design",
    "workflow_runtime",
    "files",
    "messaging",
    "governance",
}

FORBIDDEN_INTERNAL_SEGMENTS = {"domain", "persistence"}


def _python_files() -> list[Path]:
    return sorted(SRC_ROOT.rglob("*.py"))


def _imports_for(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imports: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)
    return imports


def test_backend_dependency_constraints_are_approved() -> None:
    data = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))
    project = data["project"]
    versions = data["tool"]["moviqo"]

    assert project["requires-python"] == ">=3.14.6,<3.15"
    assert "Django==5.2.15" in project["dependencies"]
    assert "djangorestframework==3.17.1" in project["dependencies"]
    assert "psycopg[binary]==3.3.4" in project["dependencies"]
    assert "drf-spectacular==0.30.0" in project["dependencies"]
    assert versions["postgresql"] == "17.10"
    assert "pytest==9.1.1" in data["dependency-groups"]["dev"]


def test_no_forbidden_runtime_dependencies_are_declared() -> None:
    data = tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))
    declared = "\n".join(data["project"]["dependencies"] + data["dependency-groups"]["dev"]).lower()

    for forbidden in data["tool"]["moviqo"]["forbidden_dependencies"]:
        assert forbidden not in declared, f"Forbidden dependency declared: {forbidden}"


@pytest.mark.parametrize("module", sorted(MODULES))
def test_module_exposes_public_application_contract(module: str) -> None:
    contract = SRC_ROOT / "moviqo" / "modules" / module / "application" / "__init__.py"

    assert contract.exists(), f"{module} must expose moviqo.modules.{module}.application"


def test_composition_roots_may_import_application_contracts() -> None:
    imports = {
        imported
        for path in [SRC_ROOT / "moviqo" / "urls.py", SRC_ROOT / "moviqo" / "jobs" / "health.py"]
        for imported in _imports_for(path)
    }

    assert "moviqo.modules.organizations.application" in imports


def test_modules_do_not_import_other_modules_internal_layers() -> None:
    violations: list[str] = []

    for path in _python_files():
        relative = path.relative_to(SRC_ROOT)
        parts = relative.parts
        if len(parts) < 4 or parts[:2] != ("moviqo", "modules"):
            continue

        source_module = parts[2]
        for imported in _imports_for(path):
            segments = imported.split(".")
            if segments[:2] != ["moviqo", "modules"] or len(segments) < 5:
                continue

            target_module = segments[2]
            target_layer = segments[3]
            if target_module != source_module and target_layer in FORBIDDEN_INTERNAL_SEGMENTS:
                violations.append(
                    f"{source_module} imports {imported}; use "
                    f"moviqo.modules.{target_module}.application instead"
                )

    assert not violations, "\n".join(violations)


def test_module_dependency_graph_has_no_cycles() -> None:
    graph: dict[str, set[str]] = {module: set() for module in MODULES}

    for path in _python_files():
        relative = path.relative_to(SRC_ROOT)
        parts = relative.parts
        if len(parts) < 4 or parts[:2] != ("moviqo", "modules"):
            continue

        source_module = parts[2]
        for imported in _imports_for(path):
            segments = imported.split(".")
            if segments[:3] == ["moviqo", "modules", source_module]:
                continue
            if segments[:2] == ["moviqo", "modules"] and len(segments) >= 4:
                graph[source_module].add(segments[2])

    def visit(node: str, path: tuple[str, ...]) -> None:
        if node in path:
            cycle = " -> ".join((*path, node))
            pytest.fail(f"Cyclic module dependency found: {cycle}")
        for next_node in graph[node]:
            visit(next_node, (*path, node))

    for module in sorted(MODULES):
        visit(module, ())
