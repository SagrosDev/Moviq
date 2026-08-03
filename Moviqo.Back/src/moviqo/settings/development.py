from __future__ import annotations

import os

os.environ.setdefault("MOVIQO_SECRET_KEY", "development-only-not-for-production")
os.environ.setdefault("MOVIQO_ALLOWED_HOSTS", "localhost,127.0.0.1")
os.environ.setdefault("MOVIQO_DB_NAME", "moviqo")
os.environ.setdefault("MOVIQO_DB_USER", "moviqo")
os.environ.setdefault("MOVIQO_DB_PASSWORD", "moviqo")
os.environ.setdefault("MOVIQO_DB_HOST", "localhost")
os.environ.setdefault("MOVIQO_DB_PORT", "5432")

from moviqo.settings.base import *  # noqa: F403

DEBUG = True
