from __future__ import annotations

import shutil
from pathlib import Path
from uuid import uuid4

INFRASTRUCTURE_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = INFRASTRUCTURE_ROOT.parent
SOURCE = PROJECT_ROOT / "Moviqo.Front" / "dist"
TARGET = INFRASTRUCTURE_ROOT / "dist"


def main() -> None:
    source = SOURCE.resolve()
    target = TARGET.resolve()
    infrastructure_root = INFRASTRUCTURE_ROOT.resolve()
    if not (source / "index.html").is_file():
        raise RuntimeError("Build Moviqo.Front before staging the Firebase artifact.")
    if target.parent != infrastructure_root:
        raise RuntimeError("Refusing to stage outside Moviqo.Infrastructure.")

    staged = infrastructure_root / f".dist-stage-{uuid4().hex}"
    try:
        shutil.copytree(source, staged)
        if target.exists():
            shutil.rmtree(target)
        staged.replace(target)
    finally:
        if staged.exists():
            shutil.rmtree(staged)

    print(f"Staged Firebase artifact from {source} to {target}.")


if __name__ == "__main__":
    main()
