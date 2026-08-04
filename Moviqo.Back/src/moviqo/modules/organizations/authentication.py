from __future__ import annotations

import hashlib
from dataclasses import dataclass

from django.contrib.auth import get_user_model
from django.core.cache import cache

from moviqo.modules.organizations.user_managers import MoviqoUserManager

AUTH_FAILURE_LIMIT = 5
AUTH_FAILURE_WINDOW_SECONDS = 300


class MoviqoEmailBackend:
    """Authenticate Moviqo accounts by their normalized email address."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        email = MoviqoUserManager.normalize_identity_email(username or kwargs.get("email", ""))
        if not email or password is None:
            return None
        user_model = get_user_model()
        user = user_model.objects.filter(normalized_email=email).first()
        if user is None:
            # Keep the password operation comparable for unknown identities.
            user_model().set_password(password)
            return None
        return user if user.check_password(password) else None

    def get_user(self, user_id):
        try:
            return get_user_model().objects.get(pk=user_id)
        except get_user_model().DoesNotExist:
            return None


@dataclass(frozen=True)
class LoginRisk:
    key: str
    attempts: int


def login_risk(*, email: str, remote_address: str) -> LoginRisk:
    digest = hashlib.sha256(email.encode("utf-8")).hexdigest()
    key = f"moviqo:login-risk:{digest}:{remote_address[:64]}"
    attempts = int(cache.get(key, 0))
    return LoginRisk(key=key, attempts=attempts)


def record_login_failure(risk: LoginRisk) -> None:
    cache.add(risk.key, 0, AUTH_FAILURE_WINDOW_SECONDS)
    cache.incr(risk.key)


def clear_login_failures(risk: LoginRisk) -> None:
    cache.delete(risk.key)
