from __future__ import annotations

import os

os.environ.setdefault("MOVIQO_SECRET_KEY", "test-only")
os.environ.setdefault("MOVIQO_ALLOWED_HOSTS", "testserver,localhost")
os.environ.setdefault("MOVIQO_DB_NAME", "test")
os.environ.setdefault("MOVIQO_DB_USER", "test")
os.environ.setdefault("MOVIQO_DB_PASSWORD", "test")
os.environ.setdefault("MOVIQO_DB_HOST", "localhost")
os.environ.setdefault("MOVIQO_DB_PORT", "5432")

from moviqo.settings.base import *  # noqa: F403

DEBUG = True
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}
