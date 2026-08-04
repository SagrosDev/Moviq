from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from typing import Any

from django.conf import settings


def encrypt_secret_payload(payload: dict[str, Any]) -> str:
    plaintext = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    nonce = secrets.token_bytes(16)
    ciphertext = _xor_with_keystream(plaintext, nonce)
    mac = hmac.new(_key(), nonce + ciphertext, hashlib.sha256).digest()
    return ".".join(
        _encode(value) for value in (nonce, ciphertext, mac)
    )


def decrypt_secret_payload(envelope: str) -> dict[str, Any]:
    try:
        nonce, ciphertext, supplied_mac = (
            _decode(part) for part in envelope.split(".")
        )
        expected_mac = hmac.new(_key(), nonce + ciphertext, hashlib.sha256).digest()
        if not hmac.compare_digest(supplied_mac, expected_mac):
            raise ValueError("invalid payload authentication")
        value = json.loads(_xor_with_keystream(ciphertext, nonce).decode("utf-8"))
    except (ValueError, TypeError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("invalid encrypted payload") from exc
    if not isinstance(value, dict):
        raise ValueError("encrypted payload must be an object")
    return value


def _key() -> bytes:
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        b"moviqo:secure-payload:v1",
        hashlib.sha256,
    ).digest()


def _xor_with_keystream(value: bytes, nonce: bytes) -> bytes:
    stream = bytearray()
    counter = 0
    while len(stream) < len(value):
        stream.extend(
            hmac.new(
                _key(), nonce + counter.to_bytes(8, "big"), hashlib.sha256
            ).digest()
        )
        counter += 1
    return bytes(left ^ right for left, right in zip(value, stream, strict=False))


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("ascii")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value.encode("ascii"))
