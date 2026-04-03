"""
utils/helpers.py — Shared Utilities
"""

from datetime import datetime, timezone


def utc_now_iso() -> str:
    """Return current UTC time as ISO 8601 string."""
    return datetime.now(tz=timezone.utc).isoformat()


def truncate(text: str, max_len: int = 200) -> str:
    """Truncate text tomax_len chars with ellipsis."""
    if len(text) <= max_len:
        return text
    return text[:max_len].rstrip() + "…"


def format_confidence(value: float) -> str:
    """Return confidence as a rounded percentage string."""
    return f"{round(value)}%"
