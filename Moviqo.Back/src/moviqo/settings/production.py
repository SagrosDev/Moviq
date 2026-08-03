from __future__ import annotations

from moviqo.settings.base import *  # noqa: F403
from moviqo.settings.env import required_env_csv

DEBUG = False
ALLOWED_HOSTS = required_env_csv("MOVIQO_ALLOWED_HOSTS")
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
