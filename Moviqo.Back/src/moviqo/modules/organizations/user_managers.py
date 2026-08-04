from __future__ import annotations

from django.contrib.auth.models import UserManager


class MoviqoUserManager(UserManager):
    use_in_migrations = True

    @classmethod
    def normalize_identity_email(cls, email: str) -> str:
        return email.strip().lower()

    def normalize_email(self, email):
        email = super().normalize_email(email)
        if not email:
            return ""
        return self.normalize_identity_email(email)

    def _create_user(self, username, email, password, **extra_fields):
        email = self.normalize_email(email)
        extra_fields.setdefault("normalized_email", email)
        return super()._create_user(username, email, password, **extra_fields)
