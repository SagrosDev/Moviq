from __future__ import annotations

import os

os.environ.setdefault(
    "MOVIQO_SECRET_KEY", "ci-only-contract-key-with-sufficient-length-and-entropy-2026"
)
os.environ.setdefault("MOVIQO_ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("MOVIQO_DB_NAME", "moviqo")
os.environ.setdefault("MOVIQO_DB_USER", "moviqo")
os.environ.setdefault("MOVIQO_DB_PASSWORD", "moviqo")
os.environ.setdefault("MOVIQO_DB_HOST", "127.0.0.1")
os.environ.setdefault("MOVIQO_DB_PORT", "5432")

from moviqo.settings.base import *  # noqa: F403

DEBUG = False
