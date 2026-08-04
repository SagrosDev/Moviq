from __future__ import annotations

import ast
import tomllib
from dataclasses import dataclass
from pathlib import Path

import pytest
from django.apps import apps as django_apps
from django.db.models import ForeignKey, OneToOneField

from moviqo.building_blocks.tenancy import (
    PROTECTED_TENANT_RESOURCES,
    PROTECTED_TENANT_TABLES,
)
from moviqo.modules.organizations.models import Organization

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

PUBLIC_CONTRACT_SEGMENT = "application"


@dataclass(frozen=True)
class ImportRef:
    module: str
    relative_level: int = 0


def _python_files() -> list[Path]:
    return sorted(SRC_ROOT.rglob("*.py"))


def _imports_for(path: Path) -> list[ImportRef]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imports: list[ImportRef] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.extend(ImportRef(alias.name) for alias in node.names)
        elif isinstance(node, ast.ImportFrom):
            imports.append(ImportRef(_resolve_import_from(path, node), node.level))
    return imports


def _resolve_import_from(path: Path, node: ast.ImportFrom) -> str:
    if node.level == 0:
        return node.module or ""

    relative = path.relative_to(SRC_ROOT).with_suffix("")
    parts = relative.parts
    package = parts[:-1] if parts[-1] != "__init__" else parts[:-1]
    base = package[: len(package) - node.level + 1]
    module_parts = tuple(part for part in (node.module or "").split(".") if part)
    return ".".join((*base, *module_parts))


def _module_for_path(path: Path) -> str | None:
    parts = path.relative_to(SRC_ROOT).parts
    if len(parts) >= 4 and parts[:2] == ("moviqo", "modules"):
        return parts[2]
    return None


def _db_tables_by_module() -> dict[str, str]:
    tables: dict[str, str] = {}
    for path in _python_files():
        module = _module_for_path(path)
        if module is None:
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for class_node in [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]:
            for child in class_node.body:
                if not isinstance(child, ast.ClassDef) or child.name != "Meta":
                    continue
                for statement in child.body:
                    if (
                        isinstance(statement, ast.Assign)
                        and any(
                            isinstance(target, ast.Name) and target.id == "db_table"
                            for target in statement.targets
                        )
                        and isinstance(statement.value, ast.Constant)
                        and isinstance(statement.value.value, str)
                    ):
                        tables[statement.value.value] = module
    return tables


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
    declared = {
        dependency.split("[", 1)[0].split("==", 1)[0].lower()
        for dependency in data["project"]["dependencies"] + data["dependency-groups"]["dev"]
    }
    lock = tomllib.loads((PROJECT_ROOT / "uv.lock").read_text(encoding="utf-8"))
    locked = {package["name"].lower() for package in lock["package"]}

    for forbidden in data["tool"]["moviqo"]["forbidden_dependencies"]:
        assert forbidden not in declared, f"Forbidden dependency declared: {forbidden}"
        assert forbidden not in locked, f"Forbidden dependency locked: {forbidden}"


@pytest.mark.parametrize("module", sorted(MODULES))
def test_module_exposes_public_application_contract(module: str) -> None:
    contract = SRC_ROOT / "moviqo" / "modules" / module / "application" / "__init__.py"

    assert contract.exists(), f"{module} must expose moviqo.modules.{module}.application"


def test_composition_roots_may_import_application_contracts() -> None:
    imports = {
        imported.module
        for path in [SRC_ROOT / "moviqo" / "urls.py", SRC_ROOT / "moviqo" / "jobs" / "health.py"]
        for imported in _imports_for(path)
    }

    for module in MODULES:
        assert f"moviqo.modules.{module}.application" in imports


def test_modules_do_not_import_other_modules_internal_layers() -> None:
    violations: list[str] = []

    for path in _python_files():
        source_module = _module_for_path(path)
        if source_module is None:
            continue
        for imported in _imports_for(path):
            segments = imported.module.split(".")
            if segments[:2] != ["moviqo", "modules"] or len(segments) < 4:
                continue

            target_module = segments[2]
            target_layer = segments[3]
            if target_module != source_module and target_layer != PUBLIC_CONTRACT_SEGMENT:
                violations.append(
                    f"{source_module} imports {imported.module}; use "
                    f"moviqo.modules.{target_module}.application instead"
                )

    assert not violations, "\n".join(violations)


def test_module_dependency_graph_has_no_cycles() -> None:
    graph: dict[str, set[str]] = {module: set() for module in MODULES}

    for path in _python_files():
        source_module = _module_for_path(path)
        if source_module is None:
            continue
        for imported in _imports_for(path):
            segments = imported.module.split(".")
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


def test_modules_do_not_read_other_modules_tables_directly() -> None:
    tables = _db_tables_by_module()
    violations: list[str] = []

    for path in _python_files():
        source_module = _module_for_path(path)
        if source_module is None or "migrations" in path.parts:
            continue
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        string_literals = {
            node.value
            for node in ast.walk(tree)
            if isinstance(node, ast.Constant) and isinstance(node.value, str)
        }
        for table, target_module in tables.items():
            if target_module != source_module and table in string_literals:
                violations.append(
                    f"{source_module} references table {table}; use "
                    f"moviqo.modules.{target_module}.application instead"
                )

    assert not violations, "\n".join(violations)


def test_tenant_owned_tables_are_registered_for_rls_enforcement() -> None:
    registered_tables = {entry.table_name for entry in PROTECTED_TENANT_TABLES}
    registered_isolation_tables = {entry.table_name for entry in PROTECTED_TENANT_RESOURCES}
    tenant_owned_tables = {
        model._meta.db_table
        for model in django_apps.get_models()
        if model.__module__.startswith("moviqo.modules.")
        and not model._meta.abstract
        and not model._meta.proxy
        and any(
            isinstance(field, ForeignKey | OneToOneField)
            and field.concrete
            and field.remote_field is not None
            and field.remote_field.model is Organization
            for field in model._meta.get_fields()
        )
    }

    missing_rls_tables = sorted(tenant_owned_tables - registered_tables)
    missing_isolation_tables = sorted(tenant_owned_tables - registered_isolation_tables)

    assert not missing_rls_tables, (
        "Missing protected-table registration for tenant-owned tables: "
        + ", ".join(missing_rls_tables)
    )
    assert not missing_isolation_tables, (
        "Missing tenant isolation release-gate registration for tenant-owned tables: "
        + ", ".join(missing_isolation_tables)
        + ". Register them in moviqo.building_blocks.tenancy.checks.PROTECTED_TENANT_RESOURCES "
        + "and add evidence in tests/integration/test_tenant_isolation.py."
    )


def test_tenant_isolation_gate_registration_matches_rls_registration() -> None:
    protected_tables = {entry.table_name for entry in PROTECTED_TENANT_TABLES}
    isolation_tables = {entry.table_name for entry in PROTECTED_TENANT_RESOURCES}
    missing_isolation_tables = sorted(protected_tables - isolation_tables)

    assert not missing_isolation_tables, (
        "Protected tenant tables missing isolation-gate coverage: "
        + ", ".join(missing_isolation_tables)
    )
