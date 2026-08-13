from __future__ import annotations

import unicodedata


def has_meaningful_text(value: str) -> bool:
    return any(
        unicodedata.category(character)[0] in {"L", "N", "P", "S"}
        for character in value
    )
