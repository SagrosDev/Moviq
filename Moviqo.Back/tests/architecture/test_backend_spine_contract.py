from __future__ import annotations

import ast
import tomllib
from dataclasses import dataclass
from pathlib import Path

import pytest

from moviqo.building_blocks.tenancy import PROTECTED_TENANT_TABLES

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
    tenant_owned_tables: set[str] = set()
    for model_file in SRC_ROOT.glob("moviqo/modules/*/models.py"):
        tree = ast.parse(model_file.read_text(encoding="utf-8"), filename=str(model_file))
        db_table_names: dict[str, str] = {}

        for class_node in [node for node in ast.walk(tree) if isinstance(node, ast.ClassDef)]:
            has_organization_foreign_key = False
            for statement in class_node.body:
                if _is_organization_relationship(statement):
                    has_organization_foreign_key = True
                if isinstance(statement, ast.ClassDef) and statement.name == "Meta":
                    for meta_statement in statement.body:
                        if (
                            isinstance(meta_statement, ast.Assign)
                            and any(
                                isinstance(target, ast.Name) and target.id == "db_table"
                                for target in meta_statement.targets
                            )
                            and isinstance(meta_statement.value, ast.Constant)
                            and isinstance(meta_statement.value.value, str)
                        ):
                            db_table_names[class_node.name] = meta_statement.value.value
            if has_organization_foreign_key and class_node.name in db_table_names:
                tenant_owned_tables.add(db_table_names[class_node.name])

    assert tenant_owned_tables <= registered_tables


def _is_organization_relationship(statement: ast.stmt) -> bool:
    if isinstance(statement, ast.Assign):
        if len(statement.targets) != 1 or not isinstance(statement.targets[0], ast.Name):
            return False
        target_name = statement.targets[0].id
        value = statement.value
    elif isinstance(statement, ast.AnnAssign) and isinstance(statement.target, ast.Name):
        target_name = statement.target.id
        value = statement.value
    else:
        return False

    return (
        target_name == "organization"
        and isinstance(value, ast.Call)
        and isinstance(value.func, ast.Attribute)
        and value.func.attr in {"ForeignKey", "OneToOneField"}
    )
