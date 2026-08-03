from __future__ import annotations

import os

BOOL_VALUES = {
    "1": True,
    "true": True,
    "yes": True,
    "on": True,
    "0": False,
    "false": False,
    "no": False,
    "off": False,
}


def required_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def env_bool(name: str, *, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    normalized = value.lower()
    if normalized not in BOOL_VALUES:
        raise RuntimeError(f"Invalid boolean environment variable: {name}")
    return BOOL_VALUES[normalized]


def env_csv(name: str) -> list[str]:
    value = os.getenv(name, "")
    return [part.strip() for part in value.split(",") if part.strip()]


def required_env_csv(name: str) -> list[str]:
    values = env_csv(name)
    if not values:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return values


def required_env_choice(name: str, allowed_values: tuple[str, ...]) -> str:
    value = required_env(name)
    if value not in allowed_values:
        allowed = ", ".join(allowed_values)
        raise RuntimeError(
            f"Invalid environment variable {name}: expected one of [{allowed}], got {value!r}"
        )
    return value
