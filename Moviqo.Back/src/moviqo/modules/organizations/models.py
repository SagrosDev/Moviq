from __future__ import annotations

from django.contrib.auth.models import AbstractUser


class MoviqoUser(AbstractUser):
    """Minimal custom user model required before the first migration."""

    class Meta:
        db_table = "organizations_moviqo_user"
